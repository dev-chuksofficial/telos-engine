"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register } from "@/app/actions/auth";
import type { FormState } from "@/types/auth";

type Props = { mode: "login" | "register" };

function Field({
  label,
  name,
  type,
  autoComplete,
  error,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="w-full rounded-sm border border-navy-900/20 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gold-500"
      />
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function AuthForm({ mode }: Props) {
  const isRegister = mode === "register";
  const [state, action, pending] = useActionState<FormState, FormData>(
    isRegister ? register : login,
    undefined
  );

  return (
    <div className="rounded-sm border border-ivory-200 bg-ivory-50 p-8 shadow-sm">
      <h1 className="font-serif text-3xl font-semibold">
        {isRegister ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-navy-900/70">
        {isRegister
          ? "Start turning ideas into live websites."
          : "Log in to continue building."}
      </p>

      <form action={action} className="mt-8 space-y-5">
        {isRegister && (
          <Field
            label="Full name"
            name="name"
            type="text"
            autoComplete="name"
            error={state?.fieldErrors?.name?.[0]}
          />
        )}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          error={state?.fieldErrors?.email?.[0]}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          error={state?.fieldErrors?.password?.[0]}
        />

        {state?.error && (
          <p className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-sm bg-gold-500 px-6 py-3 text-sm font-semibold tracking-wide text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Please wait..." : isRegister ? "Create account" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-900/70">
        {isRegister ? "Already have an account? " : "New to Telos Engine? "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-semibold text-gold-600 hover:underline"
        >
          {isRegister ? "Log in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}