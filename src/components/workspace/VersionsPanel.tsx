"use client";

import { useState } from "react";
import {
  deleteVersion,
  restoreVersion,
  saveVersion,
} from "@/app/actions/versions";

type FileItem = { path: string; content: string };

export type VersionItem = {
  id: string;
  label: string;
  createdAt: string;
};

const PREFIX = "Version: ";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VersionsPanel({
  projectId,
  initialVersions,
  hasUnsaved,
  onReplaceAll,
}: {
  projectId: string;
  initialVersions: VersionItem[];
  hasUnsaved: boolean;
  onReplaceAll: (files: FileItem[]) => void;
}) {
  const [versions, setVersions] = useState<VersionItem[]>(initialVersions);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function guardUnsaved() {
    if (hasUnsaved) {
      setError("Save your edits first (files marked with *), then try again.");
      return true;
    }
    return false;
  }

  async function save() {
    if (busy || guardUnsaved()) return;
    setError(null);
    setNotice(null);
    setBusy("save");
    try {
      const res = await saveVersion(projectId, name);
      if (res.ok) {
        setVersions((prev) => [res.version, ...prev]);
        setName("");
        setNotice("Version saved.");
      } else {
        setError(res.error);
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function restore(v: VersionItem) {
    if (busy || guardUnsaved()) return;
    const label = v.label.slice(PREFIX.length);
    if (
      !window.confirm(
        `Restore "${label}"? Your current files will be replaced. You can undo this with "Undo last AI change".`
      )
    ) {
      return;
    }
    setError(null);
    setNotice(null);
    setBusy(v.id);
    try {
      const res = await restoreVersion(projectId, v.id);
      if (res.ok) {
        onReplaceAll(res.files);
        setNotice(`Restored "${label}".`);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(v: VersionItem) {
    if (busy) return;
    const label = v.label.slice(PREFIX.length);
    if (!window.confirm(`Delete the saved version "${label}"?`)) return;
    setError(null);
    setNotice(null);
    setBusy(v.id);
    try {
      const res = await deleteVersion(projectId, v.id);
      if (res.ok) {
        setVersions((prev) => prev.filter((x) => x.id !== v.id));
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
          Saved versions
        </p>
      </div>

      <div className="flex flex-wrap gap-3 p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Name this version, e.g. Before the new header"
          className="min-w-0 flex-1 rounded-sm border border-navy-900/20 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gold-500"
        />
        <button
          type="button"
          onClick={save}
          disabled={busy !== null || name.trim().length < 2}
          className="rounded-sm bg-gold-500 px-6 py-3 text-sm font-semibold tracking-wide text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "save" ? "Saving..." : "Save version"}
        </button>
      </div>

      {error && (
        <p className="mx-4 mb-3 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {notice && (
        <p className="mx-4 mb-3 rounded-sm border border-gold-500 bg-white px-4 py-3 text-sm text-navy-900/80">
          {notice}
        </p>
      )}

      <ul className="divide-y divide-ivory-200 border-t border-ivory-200">
        {versions.length === 0 && (
          <li className="px-4 py-4 text-sm text-navy-900/60">
            No saved versions yet. Save one before you make a big change.
          </li>
        )}
        {versions.map((v) => (
          <li
            key={v.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold">
                {v.label.slice(PREFIX.length)}
              </p>
              <p className="text-xs text-navy-900/50">{formatDate(v.createdAt)}</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => restore(v)}
                disabled={busy !== null}
                className="text-gold-600 hover:underline disabled:opacity-40"
              >
                {busy === v.id ? "Working..." : "Restore"}
              </button>
              <button
                type="button"
                onClick={() => remove(v)}
                disabled={busy !== null}
                className="text-navy-900/60 hover:text-red-700 disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}