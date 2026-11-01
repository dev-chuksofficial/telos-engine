"use client";

import { useEffect, useRef, useState } from "react";
import { sendInstruction, undoLastChange } from "@/app/actions/assistant";

type FileItem = { path: string; content: string };

export type ChatItem = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
};

type Props = {
  projectId: string;
  initialMessages: ChatItem[];
  hasUnsaved: boolean;
  onApply: (files: FileItem[]) => void;
  onReplaceAll: (files: FileItem[]) => void;
};

export function AssistantPanel({
  projectId,
  initialMessages,
  hasUnsaved,
  onApply,
  onReplaceAll,
}: Props) {
  const [messages, setMessages] = useState<ChatItem[]>(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  function push(role: ChatItem["role"], content: string) {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${prev.length}`, role, content },
    ]);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    if (hasUnsaved) {
      setError(
        "Save your edits first (files marked with *), then ask the assistant again."
      );
      return;
    }

    setError(null);
    setBusy(true);
    push("USER", text);
    setInput("");

    try {
      const res = await sendInstruction(projectId, text);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const note =
        res.files.length > 0
          ? `${res.summary}\n\nUpdated: ${res.files.map((f) => f.path).join(", ")}`
          : res.summary;
      push("ASSISTANT", note);
      if (res.files.length > 0) onApply(res.files);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    if (busy) return;
    if (hasUnsaved) {
      setError("Save your edits first (files marked with *), then undo.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await undoLastChange(projectId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      push("ASSISTANT", "Reverted the last change.");
      onReplaceAll(res.files);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 rounded-sm border border-ivory-200 bg-ivory-50">
      <div className="flex items-center justify-between border-b border-ivory-200 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">
          AI assistant
        </p>
        <button
          type="button"
          onClick={undo}
          disabled={busy}
          className="text-xs font-semibold text-navy-900/70 transition-colors hover:text-gold-600 disabled:opacity-40"
        >
          Undo last AI change
        </button>
      </div>

      <div ref={listRef} className="max-h-72 space-y-3 overflow-auto px-4 py-4">
        {messages.length === 0 && !busy && (
          <p className="text-sm text-navy-900/60">
            Ask for a change in plain language, for example: &ldquo;Add a fees
            page and link it in the navigation&rdquo; or &ldquo;Make the header
            navy and the buttons gold.&rdquo;
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-3xl whitespace-pre-wrap rounded-sm px-4 py-3 text-sm leading-relaxed ${
              m.role === "USER"
                ? "ml-auto bg-navy-900 text-ivory-50"
                : "border border-ivory-200 bg-white text-navy-900/80"
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <p className="text-sm text-navy-900/60">
            Working on it. This can take up to a minute...
          </p>
        )}
      </div>

      {error && (
        <p className="mx-4 mb-3 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="flex gap-3 border-t border-ivory-200 p-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          maxLength={1000}
          placeholder="Describe the change you want... (Ctrl + Enter to send)"
          className="flex-1 resize-none rounded-sm border border-navy-900/20 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gold-500"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={busy || input.trim().length < 3}
          className="self-end rounded-sm bg-gold-500 px-6 py-3 text-sm font-semibold tracking-wide text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Working..." : "Send"}
        </button>
      </div>
    </section>
  );
}