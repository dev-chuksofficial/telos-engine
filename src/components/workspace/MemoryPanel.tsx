"use client";

import { useState } from "react";
import { addMemory, deleteMemory } from "@/app/actions/memory";

export type MemoryItem = { id: string; value: string };

export function MemoryPanel({
  projectId,
  initialMemories,
}: {
  projectId: string;
  initialMemories: MemoryItem[];
}) {
  const [notes, setNotes] = useState<MemoryItem[]>(initialMemories);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (busy) return;
    setError(null);
    setBusy("add");
    try {
      const res = await addMemory(projectId, text);
      if (res.ok) {
        setNotes((prev) => [...prev, res.item]);
        setText("");
      } else {
        setError(res.error);
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (busy) return;
    setError(null);
    setBusy(id);
    try {
      const res = await deleteMemory(projectId, id);
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      } else {
        setError(res.error);
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-4 rounded-sm border border-ivory-200 bg-ivory-50">
      <div className="border-b border-ivory-200 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">
          Project memory
        </p>
        <p className="mt-1 text-xs text-navy-900/60">
          Standing notes the AI assistant always follows.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 p-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          placeholder="e.g. The school is called St. Jude's College, in Lagos"
          className="min-w-0 flex-1 rounded-sm border border-navy-900/20 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gold-500"
        />
        <button
          type="button"
          onClick={add}
          disabled={busy !== null || text.trim().length < 3}
          className="rounded-sm bg-gold-500 px-6 py-3 text-sm font-semibold tracking-wide text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "add" ? "Saving..." : "Add note"}
        </button>
      </div>

      {error && (
        <p className="mx-4 mb-3 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <ul className="divide-y divide-ivory-200 border-t border-ivory-200">
        {notes.length === 0 && (
          <li className="px-4 py-4 text-sm text-navy-900/60">
            No notes yet. Add decisions you want the AI to remember.
          </li>
        )}
        {notes.map((n) => (
          <li
            key={n.id}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <p className="text-sm leading-relaxed">{n.value}</p>
            <button
              type="button"
              onClick={() => remove(n.id)}
              disabled={busy !== null}
              className="shrink-0 text-xs font-semibold text-navy-900/60 hover:text-red-700 disabled:opacity-40"
            >
              {busy === n.id ? "Deleting..." : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}