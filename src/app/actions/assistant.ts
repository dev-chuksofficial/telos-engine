"use server";

import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { requestChanges } from "@/lib/ai/assistant";

type FileItem = { path: string; content: string };
type Fail = { ok: false; error: string };

const MAX_TOTAL_CHARS = 250_000;
const MAX_FILE_CHARS = 300_000;

function isSafePath(p: string) {
  return (
    p.length > 0 &&
    p.length <= 100 &&
    /^[A-Za-z0-9_\-./]+$/.test(p) &&
    !p.includes("..") &&
    !p.startsWith("/") &&
    /\.(html|css|js)$/.test(p)
  );
}

const snapshotSchema = z.array(
  z.object({ path: z.string(), content: z.string() })
);

async function ownedProject(projectId: string) {
  const user = await requireUser();
  return db.project.findFirst({ where: { id: projectId, userId: user.id } });
}

export async function sendInstruction(
  projectId: string,
  instruction: string
): Promise<{ ok: true; summary: string; files: FileItem[] } | Fail> {
  try {
    const project = await ownedProject(projectId);
    if (!project) return { ok: false, error: "Project not found." };

    const text = instruction.trim();
    if (text.length < 3) {
      return { ok: false, error: "Please describe the change you want." };
    }
    if (text.length > 1000) {
      return { ok: false, error: "Please keep the instruction under 1000 characters." };
    }

    const current = await db.projectFile.findMany({
      where: { projectId: project.id },
      select: { path: true, content: true },
      orderBy: { path: "asc" },
    });
    if (current.length === 0) {
      return { ok: false, error: "This project has no files yet." };
    }

    const total = current.reduce((sum, f) => sum + f.content.length, 0);
    if (total > MAX_TOTAL_CHARS) {
      return { ok: false, error: "The project is too large for the assistant." };
    }

    const recent = await db.chatMessage.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
    const history = recent
      .reverse()
      .map((m) => ({ role: m.role, content: m.content }));

    const memoryRows = await db.projectMemory.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
      select: { value: true },
    });

    const result = await requestChanges({
      name: project.name,
      description: project.description,
      files: current,
      instruction: text,
      history,
      memories: memoryRows.map((m) => m.value),
    });

    const byPath = new Map<string, FileItem>();
    for (const c of result.changes) {
      if (isSafePath(c.path) && c.content.length > 0 && c.content.length <= MAX_FILE_CHARS) {
        byPath.set(c.path, c);
      }
    }
    const changes = Array.from(byPath.values());

    if (changes.length > 0) {
      await db.$transaction([
        db.projectVersion.create({
          data: {
            projectId: project.id,
            label: `Before: ${text.slice(0, 80)}`,
            snapshot: current as unknown as Prisma.InputJsonValue,
          },
        }),
        ...changes.map((c) =>
          db.projectFile.upsert({
            where: {
              projectId_path: { projectId: project.id, path: c.path },
            },
            create: { projectId: project.id, path: c.path, content: c.content },
            update: { content: c.content },
          })
        ),
      ]);
    }

    const now = Date.now();
    await db.chatMessage.createMany({
      data: [
        { projectId: project.id, role: "USER", content: text, createdAt: new Date(now) },
        {
          projectId: project.id,
          role: "ASSISTANT",
          content: result.summary,
          createdAt: new Date(now + 1),
        },
      ],
    });

    return { ok: true, summary: result.summary, files: changes };
  } catch (err) {
    console.error("Assistant error:", err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "The assistant could not complete that request.",
    };
  }
}

export async function undoLastChange(
  projectId: string
): Promise<{ ok: true; files: FileItem[] } | Fail> {
  try {
    const project = await ownedProject(projectId);
    if (!project) return { ok: false, error: "Project not found." };

    const version = await db.projectVersion.findFirst({
      where: { projectId: project.id, label: { startsWith: "Before:" } },
      orderBy: { createdAt: "desc" },
    });
    if (!version) return { ok: false, error: "There is nothing to undo." };

    const snapshot = snapshotSchema.safeParse(version.snapshot);
    if (!snapshot.success) {
      return { ok: false, error: "The saved version could not be read." };
    }

    await db.$transaction([
      db.projectFile.deleteMany({ where: { projectId: project.id } }),
      db.projectFile.createMany({
        data: snapshot.data.map((f) => ({
          projectId: project.id,
          path: f.path,
          content: f.content,
        })),
      }),
      db.projectVersion.delete({ where: { id: version.id } }),
      db.chatMessage.create({
        data: {
          projectId: project.id,
          role: "ASSISTANT",
          content: "Reverted the last change.",
        },
      }),
    ]);

    return { ok: true, files: snapshot.data };
  } catch (err) {
    console.error("Undo error:", err);
    return { ok: false, error: "Could not undo the last change." };
  }
}