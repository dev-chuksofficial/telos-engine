"use server";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/dal";
import { generateFileContent } from "@/lib/ai/build";
import { architectureSchema, requirementsSchema } from "@/lib/ai/schemas";

type Fail = { ok: false; error: string };

const MAX_FILES = 14;

function isSafePath(p: string) {
  return (
    p.length > 0 &&
    p.length <= 100 &&
    /^[A-Za-z0-9_\-./]+$/.test(p) &&
    !p.includes("..") &&
    !p.startsWith("/")
  );
}

function weight(p: string) {
  if (p.endsWith(".css")) return 0;
  if (p.endsWith(".html")) return p === "index.html" ? 1 : 2;
  if (p.endsWith(".js")) return 3;
  return 4;
}

async function getProject(projectId: string) {
  const userId = await requireUserId();
  return db.project.findFirst({ where: { id: projectId, userId } });
}

export async function prepareBuild(
  projectId: string
): Promise<{ ok: true; paths: string[] } | Fail> {
  try {
    const project = await getProject(projectId);
    if (!project) return { ok: false, error: "Project not found." };

    const architecture = architectureSchema.safeParse(project.architecture);
    if (!architecture.success) {
      return { ok: false, error: "Design the architecture first." };
    }

    const paths = Array.from(
      new Set(architecture.data.files.map((f) => f.path).filter(isSafePath))
    )
      .sort((a, b) => weight(a) - weight(b))
      .slice(0, MAX_FILES);

    if (paths.length === 0) {
      return { ok: false, error: "The architecture has no valid files." };
    }

    await db.projectFile.deleteMany({ where: { projectId: project.id } });
    await db.project.update({
      where: { id: project.id },
      data: { status: "BUILDING" },
    });

    return { ok: true, paths };
  } catch (err) {
    console.error("Prepare build error:", err);
    return { ok: false, error: "Could not start the build. Please try again." };
  }
}

export async function buildFile(
  projectId: string,
  path: string
): Promise<{ ok: true } | Fail> {
  try {
    const project = await getProject(projectId);
    if (!project) return { ok: false, error: "Project not found." };

    const requirements = requirementsSchema.safeParse(project.requirements);
    const architecture = architectureSchema.safeParse(project.architecture);
    if (!requirements.success || !architecture.success) {
      return { ok: false, error: "Requirements or architecture are missing." };
    }

    const file = architecture.data.files.find((f) => f.path === path);
    if (!file || !isSafePath(path)) {
      return { ok: false, error: "Unknown file." };
    }

    const written = await db.projectFile.findMany({
      where: { projectId: project.id },
    });

    let existing = written.filter((f) => f.path.endsWith(".css"));
    if (path.endsWith(".html") && path !== "index.html") {
      existing = existing.concat(written.filter((f) => f.path === "index.html"));
    }
    if (path.endsWith(".js")) {
      existing = existing.concat(written.filter((f) => f.path.endsWith(".html")));
    }

    const content = await generateFileContent({
      name: project.name,
      description: project.description,
      requirements: requirements.data,
      architecture: architecture.data,
      file,
      existing: existing.map((f) => ({ path: f.path, content: f.content })),
    });

    await db.projectFile.upsert({
      where: { projectId_path: { projectId: project.id, path } },
      create: { projectId: project.id, path, content },
      update: { content },
    });

    return { ok: true };
  } catch (err) {
    console.error("Build file error:", path, err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "File generation failed.",
    };
  }
}

export async function finishBuild(
  projectId: string
): Promise<{ ok: true } | Fail> {
  try {
    const project = await getProject(projectId);
    if (!project) return { ok: false, error: "Project not found." };

    await db.project.update({
      where: { id: project.id },
      data: { status: "READY" },
    });
    return { ok: true };
  } catch (err) {
    console.error("Finish build error:", err);
    return { ok: false, error: "Could not finish the build." };
  }
}

export async function saveFile(
  projectId: string,
  path: string,
  content: string
): Promise<{ ok: true } | Fail> {
  try {
    const project = await getProject(projectId);
    if (!project) return { ok: false, error: "Project not found." };
    if (!isSafePath(path)) return { ok: false, error: "Invalid file path." };
    if (content.length > 300_000) {
      return { ok: false, error: "File is too large (limit 300,000 characters)." };
    }

    await db.projectFile.update({
      where: { projectId_path: { projectId: project.id, path } },
      data: { content } as Prisma.ProjectFileUpdateInput,
    });
    return { ok: true };
  } catch (err) {
    console.error("Save file error:", err);
    return { ok: false, error: "Could not save the file." };
  }
}

export async function buildFiles(
  projectId: string,
  paths: string[]
): Promise<{ ok: true; failed: string[] } | Fail> {
  try {
    if (paths.length === 0 || paths.length > 8) {
      return { ok: false, error: "Invalid batch." };
    }
    const results = await Promise.all(
      paths.map((p) => buildFile(projectId, p))
    );
    const failed = paths.filter((_, i) => !results[i].ok);
    return { ok: true, failed };
  } catch (err) {
    console.error("Build batch error:", err);
    return { ok: false, error: "The batch failed. Please try again." };
  }
}