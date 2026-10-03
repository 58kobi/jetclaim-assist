import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Plane, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resumeChat, sendChat, startChat, type ChatMessage } from "@/lib/chat.functions";

const STORAGE_KEY = "jetclaim-chat";

export function ChatWidget() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const start = useServerFn(startChat);
  const resume = useServerFn(resumeChat);
  const send = useServerFn(sendChat);

  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<{ id: string; token: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore a saved conversation
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { id: string; token: string };
      resume({ data: saved }).then((r) => {
        if (r.found) {
          setSession(saved);
          setMessages(r.messages);
        } else localStorage.removeItem(STORAGE_KEY);
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [resume]);

  // Presence: lets the admin panel see "visitor online now"
  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel("jetclaim-site-presence", {
      config: { presence: { key: session.id } },
    });
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ online_at: new Date().toISOString(), conversation_id: session.id });
      }
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  useEffect(() => {
    if (open && !typing) inputRef.current?.focus();
  }, [open, typing]);

  async function openChat() {
    setOpen(true);
    if (session) return;
    setTyping(true);
    try {
      const r = await start();
      const s = { id: r.id, token: r.token };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      setSession(s);
      setMessages(r.messages);
    } finally {
      setTyping(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || !session || typing) return;
    setInput("");
    const temp: ChatMessage = { id: `tmp-${Date.now()}`, sender: "visitor", message: text, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, temp]);
    setTyping(true);
    try {
      const r = await send({ data: { ...session, text } });
      setMessages((prev) => [...prev.filter((m) => m.id !== temp.id), ...r.messages]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, sender: "assistant", message: "Sorry, something went wrong. Please try again.", created_at: new Date().toISOString() },
      ]);
    } finally {
      setTyping(false);
    }
  }

  if (pathname.startsWith("/admin")) return null;

  if (!open) {
    return (
      <button
        onClick={openChat}
        aria-label="Open JetClaim support chat"
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-navy text-navy-foreground shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="size-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 flex h-[70vh] max-h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[370px]">
      <div className="flex items-center justify-between bg-navy px-4 py-3 text-navy-foreground">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-navy-foreground/15">
            <Plane className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">JetClaim Support</p>
            <p className="flex items-center gap-1 text-xs text-navy-foreground/70">
              <span className="size-1.5 rounded-full bg-success" /> Online now
            </p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close chat">
          <X className="size-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-muted/40 px-3 py-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "visitor" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.sender === "visitor" ? "bg-navy text-navy-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {m.message}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-secondary px-3 py-2 text-sm text-muted-foreground">typing…</div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border p-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message…"
          maxLength={2000}
          className="flex-1 rounded-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-navy"
        />
        <button
          onClick={handleSend}
          disabled={typing || !input.trim()}
          aria-label="Send message"
          className="flex size-9 items-center justify-center rounded-full bg-navy text-navy-foreground disabled:opacity-50"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
