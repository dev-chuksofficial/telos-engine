"use client";

import { useState } from "react";
import { deployProject } from "@/app/actions/deploy";
import { ROOT_DOMAIN, siteUrl } from "@/lib/site-url";

export function DeployPanel({
  projectId,
  currentSlug,
  suggestedSlug,
}: {
  projectId: string;
  currentSlug: string | null;
  suggestedSlug: string;
}) {
  const [slug, setSlug] = useState(currentSlug ?? suggestedSlug);
  const [liveSlug, setLiveSlug] = useState<string | null>(currentSlug);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justPublished, setJustPublished] = useState(false);

  async function publish() {
    setBusy(true);
    setError(null);
    setJustPublished(false);
    try {
      const res = await deployProject(projectId, slug);
      if (res.ok) {
        setLiveSlug(res.slug);
        setSlug(res.slug);
        setJustPublished(true);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label htmlFor="slug" className="mb-2 block text-sm font-medium">
        Site address
      </label>
      <div className="flex max-w-xl items-stretch">
        <input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          maxLength={40}
          spellCheck={false}
          className="min-w-0 flex-1 rounded-l-sm border border-navy-900/20 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gold-500"
        />
        <span className="flex items-center rounded-r-sm border border-l-0 border-navy-900/20 bg-ivory-200 px-4 text-sm text-navy-900/70">
          .{ROOT_DOMAIN}
        </span>
      </div>

      <button
        type="button"
        onClick={publish}
        disabled={busy || slug.trim().length < 3}
        className="mt-5 rounded-sm bg-gold-500 px-8 py-3 text-sm font-semibold tracking-wide text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Publishing..." : liveSlug ? "Publish latest version" : "Publish site"}
      </button>

      {error && (
        <p className="mt-4 max-w-xl rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {liveSlug && (
        <div className="mt-6 max-w-xl rounded-sm border border-gold-500 bg-ivory-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">
            {justPublished ? "Published" : "Live"}
          </p>
          <a
            href={siteUrl(liveSlug)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block break-all font-semibold text-navy-900 underline hover:text-gold-600"
          >
            {siteUrl(liveSlug)}
          </a>
          <p className="mt-3 text-sm text-navy-900/60">
            Visitors see the version you last published. Edits in the workspace
            go live only when you click Publish again.
          </p>
        </div>
      )}
    </div>
  );
}