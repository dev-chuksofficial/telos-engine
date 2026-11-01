"use server";

import { db } from "@/lib/db";
import { requireUserId } from "@/lib/dal";

type Fail = { ok: false; error: string };
type MemoryItem = { id: string; value: string };

const MAX_NOTES = 20;

async function ownedProject(projectId: string) {
  const userId = await requireUserId();
  return db.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
}

export async function addMemory(
  projectId: string,
  rawText: string
): Promise<{ ok: true; item: MemoryItem } | Fail> {
  try {
    const project = await ownedProject(projectId);
    if (!project) return { ok: false, error: "Project not found." };

    const text = rawText.trim();
    if (text.length < 3 || text.length > 300) {
      return { ok: false, error: "A note must be 3 to 300 characters." };
    }

    const count = await db.projectMemory.count({
      where: { projectId: project.id },
    });
    if (count >= MAX_NOTES) {
      return { ok: false, error: `You can keep up to ${MAX_NOTES} notes. Delete an old one first.` };
    }

    const created = await db.projectMemory.create({
      data: { projectId: project.id, key: "note", value: text },
      select: { id: true, value: true },
    });
    return { ok: true, item: created };
  } catch (err) {
    console.error("Add memory error:", err);
    return { ok: false, error: "Could not save the note. Please try again." };
  }
}

export async function deleteMemory(
  projectId: string,
  memoryId: string
): Promise<{ ok: true } | Fail> {
  try {
    const project = await ownedProject(projectId);
    if (!project) return { ok: false, error: "Project not found." };

    await db.projectMemory.deleteMany({
      where: { id: memoryId, projectId: project.id },
    });
    return { ok: true };
  } catch (err) {
    console.error("Delete memory error:", err);
    return { ok: false, error: "Could not delete the note." };
  }
}