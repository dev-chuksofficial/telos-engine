"use client";

import { useActionState } from "react";
import { analyzeProject } from "@/app/actions/analysis";
import type { FormState } from "@/types/auth";

export function AnalyzeButton({
  projectId,
  label,
}: {
  projectId: string;
  label: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    analyzeProject,
    undefined
  );

  return (
    <form action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-gold-500 px-8 py-3 text-sm font-semibold tracking-wide text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Analyzing your idea..." : label}
      </button>
      {pending && (
        <p className="mt-3 text-sm text-navy-900/60">
          This usually takes 20 to 40 seconds. Please keep this page open.
        </p>
      )}
      {state?.error && (
        <p className="mt-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
    </form>
  );
}