"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  bookId: string;
  conceptId: string;
  phase: string;
  conceptTitle: string;
  onClose: () => void;
}

export function ChatPanel({
  bookId,
  conceptId,
  phase,
  conceptTitle,
  onClose,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatHistory();
  }, [conceptId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function fetchChatHistory() {
    try {
      const res = await fetch(`/api/books/${bookId}/concepts/${conceptId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch chat:", error);
    }
  }

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages([...messages, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/books/${bookId}/concepts/${conceptId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          phase,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const quickQuestions = [
    "Explain this simply",
    "Give me an example",
    "Why does this matter?",
  ];

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-background border-l border-foreground/10 flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-foreground/10">
        <span className="font-medium">Ask</span>
        <button
          onClick={onClose}
          className="text-muted hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted mb-4">Quick questions:</p>
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setInput(q);
                }}
                className="block w-full text-left text-sm p-2 rounded-lg border border-foreground/10 hover:border-foreground/30 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${
              msg.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <span className="text-xs text-muted block mb-1">
              {msg.role === "user" ? "You" : "mote"}
            </span>
            <div
              className={`inline-block p-3 rounded-lg text-sm max-w-[90%] ${
                msg.role === "user"
                  ? "bg-accent text-white"
                  : "bg-foreground/5"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-left">
            <span className="text-xs text-muted block mb-1">mote</span>
            <div className="inline-block p-3 rounded-lg text-sm bg-foreground/5">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-foreground/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="ask..."
            className="flex-1 px-3 py-2 bg-transparent border border-foreground/20 rounded-lg focus:border-foreground/40 focus:outline-none text-sm"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-3 py-2 bg-foreground text-background rounded-lg disabled:opacity-50"
          >
            ↵
          </button>
        </div>
      </div>
    </div>
  );
}
