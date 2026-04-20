"use client";

import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/app-shell";

type Message = { role: "user" | "assistant"; content: string };

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load today's conversation
  useEffect(() => {
    fetch("/api/coach")
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length) setMessages(data.messages);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    // Placeholder for streaming assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `Error: ${err.error ?? "Something went wrong"}`,
          };
          return updated;
        });
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Network error — please try again.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="pb-4 border-b" style={{ borderColor: "var(--outline-variant)" }}>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            Coach
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--secondary)" }}>
            Ask anything about your nutrition, targets, or progress.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-2">
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Your coach is ready
              </p>
              <p className="text-xs" style={{ color: "var(--secondary)" }}>
                Ask about your macros, what to eat, or how you&apos;re tracking.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                style={
                  msg.role === "user"
                    ? {
                        backgroundColor: "var(--primary)",
                        color: "var(--background)",
                        borderBottomRightRadius: 4,
                      }
                    : {
                        backgroundColor: "var(--surface)",
                        color: "var(--foreground)",
                        borderBottomLeftRadius: 4,
                      }
                }
              >
                {msg.content || (
                  <span style={{ opacity: 0.5 }}>
                    <span className="animate-pulse">●</span>
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="pt-3 border-t"
          style={{ borderColor: "var(--outline-variant)" }}
        >
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask your coach..."
              disabled={streaming}
              rows={1}
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none resize-none disabled:opacity-50"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--outline-variant)",
                color: "var(--foreground)",
                maxHeight: 120,
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || streaming}
              className="rounded-xl px-4 py-3 text-sm font-semibold transition-opacity disabled:opacity-40 shrink-0"
              style={{ backgroundColor: "var(--primary)", color: "var(--background)" }}
            >
              {streaming ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                "Send"
              )}
            </button>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: "var(--secondary)", opacity: 0.5 }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </AppShell>
  );
}
