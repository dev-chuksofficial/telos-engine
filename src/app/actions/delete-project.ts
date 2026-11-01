
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/dal";

export async function deleteProject(
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();

    const result = await db.project.deleteMany({
      where: { id: projectId, userId },
    });
    if (result.count === 0) {
      return { ok: false, error: "Project not found." };
    }

    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    console.error("Delete project error:", err);
    return { ok: false, error: "Could not delete the project. Please try again." };
  }
}