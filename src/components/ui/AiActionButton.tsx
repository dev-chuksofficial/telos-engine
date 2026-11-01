"use client";

import { useActionState } from "react";
import type { FormState } from "@/types/auth";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  projectId: string;
  label: string;
  pendingLabel: string;
};

export function AiActionButton({
  action,
  projectId,
  label,
  pendingLabel,
}: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-gold-500 px-8 py-3 text-sm font-semibold tracking-wide text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? pendingLabel : label}
      </button>
      {pending && (
        <p className="mt-3 text-sm text-navy-900/60">
          Please keep this page open. This can take up to a minute.
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