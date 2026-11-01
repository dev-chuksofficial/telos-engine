"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory-100 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
        Something went wrong
      </p>
      <h1 className="mt-3 font-serif text-5xl font-semibold">
        We couldn&rsquo;t load this page
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-navy-900/70">
        This is usually a short connection problem with the database. Please
        try again in a moment.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-sm bg-gold-500 px-6 py-3 text-sm font-semibold tracking-wide text-navy-950 transition-colors hover:bg-gold-400"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-sm border border-navy-900 px-6 py-3 text-sm font-semibold tracking-wide text-navy-900 transition-colors hover:bg-navy-900 hover:text-ivory-50"
        >
          Go to dashboard
        </a>
      </div>
    </main>
  );
}