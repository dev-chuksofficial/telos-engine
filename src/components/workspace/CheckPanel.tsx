"use client";

import { useState } from "react";
import { sendInstruction } from "@/app/actions/assistant";
import {
  checkProject,
  issuesToInstruction,
  type Issue,
} from "@/lib/check";

type FileItem = { path: string; content: string };

export function CheckPanel({
  projectId,
  files,
  hasUnsaved,
  onApply,
}: {
  projectId: string;
  files: Record<string, string>;
  hasUnsaved: boolean;
  onApply: (files: FileItem[]) => void;
}) {
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  function run() {
    setError(null);
    setResult(null);
    setIssues(checkProject(files));
  }

  async function fix() {
    if (!issues || issues.length === 0 || busy) return;
    if (hasUnsaved) {
      setError("Save your edits first (files marked with *), then use Fix with AI.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await sendInstruction(projectId, issuesToInstruction(issues));
      if (res.ok) {
        if (res.files.length > 0) onApply(res.files);
        setResult(
          res.files.length > 0
            ? `${res.summary} Updated: ${res.files.map((f) => f.path).join(", ")}. Click Run check to verify.`
            : res.summary
        );
        setIssues(null);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const errors = issues?.filter((i) => i.severity === "error").length ?? 0;
  const warnings = issues?.filter((i) => i.severity === "warning").length ?? 0;

  return (
    <section className="mt-4 rounded-sm border border-ivory-200 bg-ivory-50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory-200 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">
            Project check
          </p>
          <p className="mt-1 text-xs text-navy-900/60">
            Finds broken links, missing files and script errors. It checks your
            current edits, even unsaved ones.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="rounded-sm bg-gold-500 px-5 py-2 text-sm font-semibold tracking-wide text-navy-950 transition-colors hover:bg-gold-400 disabled:opacity-50"
          >
            Run check
          </button>
          {issues && issues.length > 0 && (
            <button
              type="button"
              onClick={fix}
              disabled={busy}
              className="rounded-sm border border-navy-900 px-5 py-2 text-sm font-semibold tracking-wide text-navy-900 transition-colors hover:bg-navy-900 hover:text-ivory-50 disabled:opacity-50"
            >
              {busy ? "Fixing..." : "Fix with AI"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="m-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {result && (
        <p className="m-4 whitespace-pre-wrap rounded-sm border border-gold-500 bg-white px-4 py-3 text-sm text-navy-900/80">
          {result}
        </p>
      )}

      {issues && issues.length === 0 && (
        <p className="m-4 rounded-sm border border-gold-500 bg-white px-4 py-3 text-sm font-semibold text-navy-900">
          No problems found. Your links, files and scripts all check out.
        </p>
      )}

      {issues && issues.length > 0 && (
        <>
          <p className="px-4 pt-4 text-sm font-semibold">
            {errors} {errors === 1 ? "error" : "errors"}, {warnings}{" "}
            {warnings === 1 ? "warning" : "warnings"}
          </p>
          <ul className="mt-3 divide-y divide-ivory-200 border-t border-ivory-200">
            {issues.map((i, idx) => (
              <li key={idx} className="flex items-start gap-3 px-4 py-3">
                <span
                  className={`mt-0.5 shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                    i.severity === "error"
                      ? "bg-red-100 text-red-800"
                      : "bg-gold-400/30 text-gold-600"
                  }`}
                >
                  {i.severity}
                </span>
                <div className="min-w-0">
                  <code className="text-xs">{i.file}</code>
                  <p className="mt-1 text-sm text-navy-900/80">{i.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}