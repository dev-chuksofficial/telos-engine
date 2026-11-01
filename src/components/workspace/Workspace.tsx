"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { saveFile } from "@/app/actions/build";
import { buildPreviewHtml, resolvePath } from "@/lib/preview";
import {
  AssistantPanel,
  type ChatItem,
} from "@/components/workspace/AssistantPanel";
import {
  VersionsPanel,
  type VersionItem,
} from "@/components/workspace/VersionsPanel";
import {
  MemoryPanel,
  type MemoryItem,
} from "@/components/workspace/MemoryPanel";
import { CheckPanel } from "@/components/workspace/CheckPanel";

type FileItem = { path: string; content: string };

function toMap(list: FileItem[]): Record<string, string> {
  return Object.fromEntries(list.map((f) => [f.path, f.content]));
}

function pickStart(map: Record<string, string>): string {
  const keys = Object.keys(map);
  if (keys.includes("index.html")) return "index.html";
  return keys.find((k) => k.endsWith(".html")) ?? keys[0] ?? "";
}

export function Workspace({
  projectId,
  initialFiles,
  initialMessages,
  initialVersions,
  initialMemories,
}: {
  projectId: string;
  initialFiles: FileItem[];
  initialMessages: ChatItem[];  
  initialVersions: VersionItem[];
  initialMemories: MemoryItem[];
}) {
  const [files, setFiles] = useState<Record<string, string>>(() =>
    toMap(initialFiles)
  );
  const [previewFiles, setPreviewFiles] = useState(files);

  const startPath = pickStart(files);

  const [selected, setSelected] = useState(startPath);
  const [previewPath, setPreviewPath] = useState(startPath);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const paths = useMemo(() => Object.keys(files).sort(), [files]);

  useEffect(() => {
    const timer = setTimeout(() => setPreviewFiles(files), 400);
    return () => clearTimeout(timer);
  }, [files]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== frameRef.current?.contentWindow) return;
      const data = e.data as { type?: string; href?: string } | null;
      if (data?.type !== "telos-nav" || !data.href) return;

      const target = resolvePath(previewPath, data.href);
      if (target in files) {
        setPreviewPath(target);
        setSelected(target);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [files, previewPath]);

  const previewHtml = useMemo(
    () => buildPreviewHtml(previewFiles, previewPath),
    [previewFiles, previewPath]
  );

  function selectFile(path: string) {
    setSelected(path);
    if (path.endsWith(".html")) setPreviewPath(path);
  }

  function edit(value: string) {
    setFiles((prev) => ({ ...prev, [selected]: value }));
    setDirty((prev) => new Set(prev).add(selected));
    setStatus(null);
  }

  async function save() {
    setStatus("Saving...");
    try {
      const res = await saveFile(projectId, selected, files[selected]);
      if (res.ok) {
        setDirty((prev) => {
          const next = new Set(prev);
          next.delete(selected);
          return next;
        });
        setStatus("Saved");
      } else {
        setStatus(res.error);
      }
    } catch {
      setStatus("Could not save. Check your connection.");
    }
  }

  function applyChanges(changed: FileItem[]) {
    const merged = { ...files, ...toMap(changed) };
    setFiles(merged);
    setPreviewFiles(merged);
    setDirty(new Set());
  }

  function replaceAll(list: FileItem[]) {
    const next = toMap(list);
    setFiles(next);
    setPreviewFiles(next);
    setDirty(new Set());
    if (!(selected in next)) setSelected(pickStart(next));
    if (!(previewPath in next)) setPreviewPath(pickStart(next));
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr_1fr]">
        <aside className="rounded-sm border border-navy-800 bg-navy-900 p-3 text-ivory-200">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">
            Files
          </p>
          <ul className="space-y-1">
            {paths.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => selectFile(p)}
                  className={`w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${
                    p === selected
                      ? "bg-navy-700 text-ivory-50"
                      : "hover:bg-navy-800"
                  }`}
                >
                  {p}
                  {dirty.has(p) && <span className="ml-1 text-gold-400">*</span>}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex flex-col rounded-sm border border-ivory-200 bg-ivory-50">
          <div className="flex items-center justify-between border-b border-ivory-200 px-4 py-2">
            <code className="text-sm">{selected}</code>
            <div className="flex items-center gap-3">
              {status && (
                <span className="text-xs text-navy-900/60">{status}</span>
              )}
              <button
                type="button"
                onClick={save}
                disabled={!dirty.has(selected)}
                className="rounded-sm bg-gold-500 px-4 py-1.5 text-xs font-semibold text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
          <textarea
            value={files[selected] ?? ""}
            onChange={(e) => edit(e.target.value)}
            spellCheck={false}
            wrap="off"
            className="h-[65vh] w-full resize-none overflow-auto bg-white p-4 font-mono text-[13px] leading-relaxed outline-none"
          />
        </section>

        <section className="flex flex-col rounded-sm border border-ivory-200 bg-ivory-50">
          <div className="flex items-center justify-between border-b border-ivory-200 px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">
              Live preview
            </p>
                        <code className="text-xs text-navy-900/60">{previewPath}</code>
                                  </div>
          <iframe
            ref={frameRef}
            title="Live preview"
            sandbox="allow-scripts"
            srcDoc={previewHtml}
            className="h-[65vh] w-full bg-white"
          />
        </section>
      </div>

          <CheckPanel
        projectId={projectId}
        files={files}
        hasUnsaved={dirty.size > 0}
        onApply={applyChanges}
      />

      <AssistantPanel
        projectId={projectId}
        initialMessages={initialMessages}
        hasUnsaved={dirty.size > 0}
        onApply={applyChanges}
        onReplaceAll={replaceAll}
      />

           <MemoryPanel projectId={projectId} initialMemories={initialMemories} />

      <VersionsPanel
        projectId={projectId}
        initialVersions={initialVersions}
        hasUnsaved={dirty.size > 0}
        onReplaceAll={replaceAll}
      />
    </>
  );
}