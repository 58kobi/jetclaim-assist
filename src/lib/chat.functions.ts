import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ChatMessage = {
  id: string;
  sender: "visitor" | "assistant";
  message: string;
  created_at: string;
};

const auth = z.object({ id: z.string().uuid(), token: z.string().uuid() });

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function loadConv(id: string, token: string) {
  const db = await admin();
  const { data } = await db
    .from("chat_conversations")
    .select("*")
    .eq("id", id)
    .eq("visitor_token", token)
    .maybeSingle();
  return data;
}

async function listMessages(id: string) {
  const db = await admin();
  const { data } = await db
    .from("chat_messages")
    .select("id, sender, message, created_at")
    .eq("conversation_id", id)
    .order("created_at");
  return (data ?? []) as ChatMessage[];
}

async function insertMessage(conversationId: string, sender: "visitor" | "assistant", message: string) {
  const db = await admin();
  const { data, error } = await db
    .from("chat_messages")
    .insert({ conversation_id: conversationId, sender, message })
    .select("id, sender, message, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data as ChatMessage;
}

export const startChat = createServerFn({ method: "POST" }).handler(async () => {
  const { CHAT_DISCLOSURE, CHAT_GREETING } = await import("./chat.server");
  const db = await admin();
  const { data, error } = await db
    .from("chat_conversations")
    .insert({ status: "new" })
    .select("id, visitor_token")
    .single();
  if (error || !data) throw new Error("Could not start chat");
  await insertMessage(data.id, "assistant", CHAT_DISCLOSURE);
  await insertMessage(data.id, "assistant", CHAT_GREETING);
  return { id: data.id, token: data.visitor_token, messages: await listMessages(data.id) };
});

export const resumeChat = createServerFn({ method: "POST" })
  .inputValidator((d) => auth.parse(d))
  .handler(async ({ data }) => {
    const conv = await loadConv(data.id, data.token);
    if (!conv) return { found: false as const, messages: [] as ChatMessage[] };
    return { found: true as const, messages: await listMessages(conv.id) };
  });

export const sendChat = createServerFn({ method: "POST" })
  .inputValidator((d) => auth.extend({ text: z.string().trim().min(1).max(2000) }).parse(d))
  .handler(async ({ data }) => {
    const conv = await loadConv(data.id, data.token);
    if (!conv) throw new Error("Chat not found");
    const db = await admin();
    const text = data.text;
    const added: ChatMessage[] = [await insertMessage(conv.id, "visitor", text)];
    let reply: string;

    if (!conv.visitor_name) {
      await db.from("chat_conversations").update({ visitor_name: text.slice(0, 120) }).eq("id", conv.id);
      reply = `Thanks, ${text.split(" ")[0]}. Could I get your email so we can follow up?`;
    } else if (!conv.visitor_email) {
      if (!z.string().email().safeParse(text).success) {
        reply = "That doesn't look like a valid email address — could you check it and send it again?";
      } else {
        await db.from("chat_conversations").update({ visitor_email: text }).eq("id", conv.id);
        reply = "Got it. And a phone number, in case we need to reach you quickly?";
      }
    } else if (!conv.visitor_phone) {
      await db.from("chat_conversations").update({ visitor_phone: text.slice(0, 40) }).eq("id", conv.id);
      reply =
        "Last thing — what flight are we looking at? Airline, flight number, date, and what happened (delay, cancellation, baggage, etc.).";
    } else if (!conv.flight_details) {
      await db.from("chat_conversations").update({ flight_details: text }).eq("id", conv.id);
      reply =
        'Thanks — I\'ve got what I need. Our team will review this and follow up by email. You can also file a full claim anytime from the "File a Claim" page. Feel free to ask me anything in the meantime.';
    } else {
      const { generateAssistantReply } = await import("./chat.server");
      const history = (await listMessages(conv.id)).slice(-20).map((m) => ({
        role: m.sender === "visitor" ? ("user" as const) : ("assistant" as const),
        content: m.message,
      }));
      try {
        reply = await generateAssistantReply(history);
      } catch (e) {
        console.error("chat AI error", e);
        reply =
          "Sorry, I couldn't answer that right now. Our support team will see your message, or you can email jetclaimsupport@gmail.com.";
      }
    }

    added.push(await insertMessage(conv.id, "assistant", reply));
    return { messages: added };
  });
