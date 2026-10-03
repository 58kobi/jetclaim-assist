import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayRunIdFetch } from "./ai/run-id.server";

export const CHAT_DISCLOSURE = "This chat may be reviewed by our support team.";
export const CHAT_GREETING =
  "Hi, I'm the JetClaim support assistant. I'm here to help you get started with your flight claim. To begin, may I have your name?";

const SYSTEM_PROMPT = `You are the JetClaim support assistant on jetclaim.online. JetClaim ("We Fight. You Fly.") helps passengers claim compensation, refunds and file complaints for flight delays, cancellations, denied boarding, lost/damaged baggage, booking failures and poor service under EU261, UK261, US DOT rules, Canada APPR, India DGCA, Brazil ANAC, Turkey SHY and the Montreal Convention.
How it works: the passenger files a claim on the "File a Claim" page, our team reviews it, forwards it to the airline, and the payout is sent to the passenger through a payout app (LemFi, WorldRemit or WapiPay). Clients track progress (Submitted, Under Review, Approved, Forwarded to Airline, Payout Received) in their account.
Support: jetclaimsupport@gmail.com, replies within 40 minutes, Monday–Sunday. Never give a phone number.
Rules: be warm, professional and brief (2–4 sentences, plain text, no markdown). Never promise a specific payout amount or guaranteed outcome. If unsure, suggest emailing support. Encourage filing a full claim when relevant.`;

export async function generateAssistantReply(history: ModelMessage[]) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system: SYSTEM_PROMPT,
    messages: history,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  const text = (await result.text).trim();
  if (!text) throw new Error("Empty reply");
  return text;
}
