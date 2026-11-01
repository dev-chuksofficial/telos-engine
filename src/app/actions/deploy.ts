"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/dal";
import { siteUrl } from "@/lib/site-url";

const RESERVED = new Set([
  "www", "app", "api", "admin", "dashboard", "login", "register", "sites",
  "static", "assets", "mail", "support", "help", "docs", "blog", "status",
  "telos", "localhost",
]);

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/,
    "Use 3 to 40 letters, numbers or dashes, and do not start or end with a dash."
  );

export async function deployProject(
  projectId: string,
  rawSlug: string
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();

    const project = await db.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) return { ok: false, error: "Project not found." };

    const parsed = slugSchema.safeParse(rawSlug);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid address." };
    }
    const slug = parsed.data;

    if (RESERVED.has(slug)) {
      return { ok: false, error: "That address is reserved. Please choose another." };
    }

    const taken = await db.project.findUnique({
      where: { subdomain: slug },
      select: { id: true },
    });
    if (taken && taken.id !== project.id) {
      return { ok: false, error: "That address is already taken. Please choose another." };
    }

    const files = await db.projectFile.findMany({
      where: { projectId: project.id },
      select: { path: true, content: true },
    });
    if (files.length === 0) {
      return { ok: false, error: "Build your project before publishing it." };
    }
    if (!files.some((f) => f.path === "index.html")) {
      return { ok: false, error: "Your project needs an index.html file to be published." };
    }

    await db.$transaction([
      db.project.update({
        where: { id: project.id },
        data: { subdomain: slug, status: "DEPLOYED" },
      }),
      db.projectVersion.deleteMany({
        where: { projectId: project.id, label: { startsWith: "Deployed" } },
      }),
      db.projectVersion.create({
        data: {
          projectId: project.id,
          label: `Deployed: ${slug}`,
          snapshot: files as unknown as Prisma.InputJsonValue,
        },
      }),
      db.deployment.create({
        data: { projectId: project.id, status: "LIVE", url: siteUrl(slug) },
      }),
    ]);

    revalidatePath(`/projects/${project.id}`);
    return { ok: true, slug };
  } catch (err) {
    console.error("Deploy error:", err);
    return { ok: false, error: "Could not publish. Please try again." };
  }
}