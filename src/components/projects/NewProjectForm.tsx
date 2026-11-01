"use client";

import { useActionState } from "react";
import { createProject } from "@/app/actions/projects";
import type { FormState } from "@/types/auth";

const inputClass =
  "w-full rounded-sm border border-navy-900/20 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gold-500";

export function NewProjectForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createProject,
    undefined
  );

  return (
    <form action={action} className="space-y-6">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          Project name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Bright Future Academy website"
          className={inputClass}
        />
        {state?.fieldErrors?.name?.[0] && (
          <p className="mt-2 text-sm text-red-700">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium">
          Describe your idea
        </label>
        <textarea
          id="description"
          name="description"
          rows={8}
          required
          placeholder="What is it for? Who will use it? Which pages or features do you need?"
          className={inputClass}
        />
        {state?.fieldErrors?.description?.[0] && (
          <p className="mt-2 text-sm text-red-700">
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>

      {state?.error && (
        <p className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-gold-500 px-8 py-3 text-sm font-semibold tracking-wide text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create project"}
      </button>
    </form>
  );
}