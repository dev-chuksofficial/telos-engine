"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/app/actions/delete-project";

export function DeleteProjectButton({
  projectId,
  name,
}: {
  projectId: string;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (
      !window.confirm(
        `Delete "${name}" permanently? Its files, saved versions and published site will be removed. This cannot be undone.`
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await deleteProject(projectId);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
        setBusy(false);
      }
    } catch {
      setError("Could not reach the server. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="text-navy-900/60 transition-colors hover:text-red-700 disabled:opacity-40"
      >
        {busy ? "Deleting..." : "Delete"}
      </button>
      {error && <p className="mt-1 text-red-700">{error}</p>}
    </div>
  );
}