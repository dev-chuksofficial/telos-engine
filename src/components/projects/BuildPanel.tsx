"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildFiles, finishBuild, prepareBuild } from "@/app/actions/build";

const BATCH_SIZE = 4;

type Progress = { done: number; total: number; current: string };

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export function BuildPanel({
  projectId,
  label,
  hasFiles,
}: {
  projectId: string;
  label: string;
  hasFiles: boolean;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (
      hasFiles &&
      !window.confirm(
        "Rebuilding replaces all current files, including any edits you made. Continue?"
      )
    ) {
      return;
    }

    setRunning(true);
    setError(null);

    try {
      const prep = await prepareBuild(projectId);
      if (!prep.ok) throw new Error(prep.error);

      const paths = prep.paths;
      const total = paths.length;
      let done = 0;

      const css = paths.filter((p) => p.endsWith(".css"));
      const index = paths.filter((p) => p === "index.html");
      const pages = paths.filter(
        (p) => p.endsWith(".html") && p !== "index.html"
      );
      const rest = paths.filter(
        (p) => !p.endsWith(".css") && !p.endsWith(".html")
      );

      // Order matters: styles first, then the home page, then the other
      // pages together, then scripts (which read the finished pages).
      const phases: string[][] = [
        ...css.map((p) => [p]),
        ...index.map((p) => [p]),
        ...chunk(pages, BATCH_SIZE),
        ...chunk(rest, BATCH_SIZE),
      ];

      for (const group of phases) {
        setProgress({ done, total, current: group.join(", ") });

        const res = await buildFiles(projectId, group);
        if (!res.ok) throw new Error(res.error);

        if (res.failed.length > 0) {
          setProgress({
            done,
            total,
            current: `Retrying ${res.failed.join(", ")}`,
          });
          const retry = await buildFiles(projectId, res.failed);
          if (!retry.ok) throw new Error(retry.error);
          if (retry.failed.length > 0) {
            throw new Error(
              `Could not generate: ${retry.failed.join(", ")}. Please try again.`
            );
          }
        }

        done += group.length;
      }

      setProgress({ done: total, total, current: "Finishing..." });
      const finished = await finishBuild(projectId);
      if (!finished.ok) throw new Error(finished.error);

      router.push(`/projects/${projectId}/workspace`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The build stopped. Check your connection and try again."
      );
      setRunning(false);
    }
  }

  const percent = progress
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="rounded-sm bg-gold-500 px-8 py-3 text-sm font-semibold tracking-wide text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {running ? "Building..." : label}
      </button>

      {running && progress && (
        <div className="mt-6 max-w-xl">
          <div className="h-2 overflow-hidden rounded-sm bg-ivory-200">
            <div
              className="h-full bg-gold-500 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-navy-900/70">
            {progress.done} of {progress.total} files done. Now writing:{" "}
            <code>{progress.current}</code>
          </p>
          <p className="mt-1 text-sm text-navy-900/50">
            Please keep this page open until it finishes.
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 max-w-xl rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}