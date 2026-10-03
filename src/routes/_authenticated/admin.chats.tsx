import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/chats")({
  head: () => ({
    meta: [
      { title: "Chat Inquiries — JetClaim Admin" },
      { name: "description", content: "Live website chat inquiries from JetClaim visitors." },
      { property: "og:title", content: "Chat Inquiries — JetClaim Admin" },
      { property: "og:description", content: "Review visitor chat transcripts and contact details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminChats,
});

type Conversation = {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  flight_details: string | null;
  status: string;
  created_at: string;
};

type Message = { id: string; sender: string; message: string; created_at: string };

const statusStyle: Record<string, string> = {
  new: "border-warning/40 bg-warning/10 text-warning",
  reviewed: "border-brand-blue/30 bg-brand-blue/10 text-brand-blue",
  converted_to_claim: "border-success/40 bg-success/10 text-success",
};

function AdminChats() {
  const { isAdmin } = useIsAdmin();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("chat_conversations")
      .select("id, visitor_name, visitor_email, visitor_phone, flight_details, status, created_at")
      .order("created_at", { ascending: false });
    if (data) {
      setConversations(data);
      setSelected((s) => (s ? (data.find((c) => c.id === s.id) ?? s) : s));
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadConversations();
    const convChannel = supabase
      .channel("admin-chat-conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => loadConversations())
      .subscribe();
    const presenceChannel = supabase.channel("jetclaim-site-presence");
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const ids = new Set<string>();
        Object.values(presenceChannel.presenceState()).forEach((entries) => {
          (entries as Array<{ conversation_id?: string }>).forEach((e) => e.conversation_id && ids.add(e.conversation_id));
        });
        setOnlineIds(ids);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(convChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [isAdmin, loadConversations]);

  const selectedId = selected?.id;
  useEffect(() => {
    if (!selectedId) return;
    supabase
      .from("chat_messages")
      .select("id, sender, message, created_at")
      .eq("conversation_id", selectedId)
      .order("created_at")
      .then(({ data }) => data && setMessages(data));
    const channel = supabase
      .channel(`admin-chat-${selectedId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${selectedId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  async function setStatus(conv: Conversation, status: string) {
    await supabase.from("chat_conversations").update({ status }).eq("id", conv.id);
    loadConversations();
  }

  return (
    <AdminShell title="Chat inquiries" subtitle="Live conversations from the website chat.">
      <div className="flex h-[calc(100vh-12rem)] min-h-[500px] flex-col gap-4 md:flex-row">
        <div className="overflow-y-auto rounded-xl border border-border bg-background md:w-[340px]">
          {conversations.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">No chats yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={cn(
                  "flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left hover:bg-muted/50",
                  selected?.id === c.id && "bg-muted/60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-navy">
                    <span
                      className={cn("size-2 rounded-full", onlineIds.has(c.id) ? "bg-success" : "bg-muted-foreground/30")}
                      title={onlineIds.has(c.id) ? "Online now" : "Offline"}
                    />
                    {c.visitor_name || "Unnamed visitor"}
                  </span>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize", statusStyle[c.status])}>
                    {c.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{c.visitor_email || "No email yet"}</p>
                <p className="text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleString("en-GB")}</p>
              </button>
            ))
          )}
        </div>

        <div className="flex-1 overflow-hidden rounded-xl border border-border bg-background">
          {!selected ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Select a conversation to view the transcript
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
                <div className="text-sm">
                  <p className="font-semibold text-navy">{selected.visitor_name || "Unnamed visitor"}</p>
                  <p className="text-xs text-muted-foreground">
                    {selected.visitor_email ?? "—"} {selected.visitor_phone && `· ${selected.visitor_phone}`}
                  </p>
                  {selected.flight_details && (
                    <p className="mt-1 text-xs text-muted-foreground">Flight: {selected.flight_details}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {selected.status === "new" && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(selected, "reviewed")}>
                      Mark reviewed
                    </Button>
                  )}
                  {selected.status !== "converted_to_claim" && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(selected, "converted_to_claim")}>
                      Converted to claim
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto bg-muted/40 px-4 py-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                        m.sender === "visitor" ? "bg-navy text-navy-foreground" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
