"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { designArchitecture } from "@/lib/ai/architecture";
import { requirementsSchema } from "@/lib/ai/schemas";
import type { FormState } from "@/types/auth";

export async function generateArchitecture(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");

  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) return { error: "Project not found." };

  const requirements = requirementsSchema.safeParse(project.requirements);
  if (!requirements.success) {
    return { error: "Run the requirements analysis first." };
  }

  try {
    const architecture = await designArchitecture(
      project.name,
      project.description,
      requirements.data
    );

    await db.project.update({
      where: { id: project.id },
      data: { architecture: architecture as Prisma.InputJsonValue },
    });
  } catch (err) {
    console.error("Architecture error:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Architecture generation failed. Please try again.",
    };
  }

  revalidatePath(`/projects/${project.id}`);
  return undefined;
}