"use server";

import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/dal";

type FileItem = { path: string; content: string };
type Fail = { ok: false; error: string };
type VersionItem = { id: string; label: string; createdAt: string };

const MAX_VERSIONS = 20;
const PREFIX = "Version: ";

const snapshotSchema = z.array(
  z.object({ path: z.string(), content: z.string() })
);

async function ownedProject(projectId: string) {
  const userId = await requireUserId();
  return db.project.findFirst({ where: { id: projectId, userId } });
}

export async function saveVersion(
  projectId: string,
  rawName: string
): Promise<{ ok: true; version: VersionItem } | Fail> {
  try {
    const project = await ownedProject(projectId);
    if (!project) return { ok: false, error: "Project not found." };

    const name = rawName.trim();
    if (name.length < 2 || name.length > 60) {
      return { ok: false, error: "Give the version a name of 2 to 60 characters." };
    }

    const count = await db.projectVersion.count({
      where: { projectId: project.id, label: { startsWith: PREFIX } },
    });
    if (count >= MAX_VERSIONS) {
      return { ok: false, error: `You can keep up to ${MAX_VERSIONS} versions. Delete an old one first.` };
    }

    const files = await db.projectFile.findMany({
      where: { projectId: project.id },
      select: { path: true, content: true },
      orderBy: { path: "asc" },
    });
    if (files.length === 0) {
      return { ok: false, error: "There are no files to save." };
    }

    const created = await db.projectVersion.create({
      data: {
        projectId: project.id,
        label: PREFIX + name,
        snapshot: files as unknown as Prisma.InputJsonValue,
      },
      select: { id: true, label: true, createdAt: true },
    });

    return {
      ok: true,
      version: {
        id: created.id,
        label: created.label,
        createdAt: created.createdAt.toISOString(),
      },
    };
  } catch (err) {
    console.error("Save version error:", err);
    return { ok: false, error: "Could not save the version. Please try again." };
  }
}

export async function restoreVersion(
  projectId: string,
  versionId: string
): Promise<{ ok: true; files: FileItem[] } | Fail> {
  try {
    const project = await ownedProject(projectId);
    if (!project) return { ok: false, error: "Project not found." };

    const version = await db.projectVersion.findFirst({
      where: {
        id: versionId,
        projectId: project.id,
        label: { startsWith: PREFIX },
      },
    });
    if (!version) return { ok: false, error: "Version not found." };

    const snapshot = snapshotSchema.safeParse(version.snapshot);
    if (!snapshot.success || snapshot.data.length === 0) {
      return { ok: false, error: "The saved version could not be read." };
    }

    const current = await db.projectFile.findMany({
      where: { projectId: project.id },
      select: { path: true, content: true },
      orderBy: { path: "asc" },
    });

    const name = version.label.slice(PREFIX.length);

    await db.$transaction([
      db.projectVersion.create({
        data: {
          projectId: project.id,
          label: `Before: restore of "${name}"`.slice(0, 90),
          snapshot: current as unknown as Prisma.InputJsonValue,
        },
      }),
      db.projectFile.deleteMany({ where: { projectId: project.id } }),
      db.projectFile.createMany({
        data: snapshot.data.map((f) => ({
          projectId: project.id,
          path: f.path,
          content: f.content,
        })),
      }),
    ]);

    return { ok: true, files: snapshot.data };
  } catch (err) {
    console.error("Restore version error:", err);
    return { ok: false, error: "Could not restore the version. Please try again." };
  }
}

export async function deleteVersion(
  projectId: string,
  versionId: string
): Promise<{ ok: true } | Fail> {
  try {
    const project = await ownedProject(projectId);
    if (!project) return { ok: false, error: "Project not found." };

    await db.projectVersion.deleteMany({
      where: {
        id: versionId,
        projectId: project.id,
        label: { startsWith: PREFIX },
      },
    });
    return { ok: true };
  } catch (err) {
    console.error("Delete version error:", err);
    return { ok: false, error: "Could not delete the version." };
  }
}