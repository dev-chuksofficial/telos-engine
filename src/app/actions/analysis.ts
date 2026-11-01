"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { analyzeRequirements } from "@/lib/ai/analysis";
import type { FormState } from "@/types/auth";

export async function analyzeProject(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");

  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) return { error: "Project not found." };

  try {
    const requirements = await analyzeRequirements(
      project.name,
      project.description
    );

    await db.project.update({
      where: { id: project.id },
      data: {
        requirements: requirements as Prisma.InputJsonValue,
        status: "ANALYZED",
      },
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Analysis failed. Please try again.",
    };
  }

  revalidatePath(`/projects/${project.id}`);
  return undefined;
}