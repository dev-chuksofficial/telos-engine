"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import type { FormState } from "@/types/auth";

const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters")
    .max(60, "Project name must be 60 characters or fewer"),
  description: z
    .string()
    .trim()
    .min(20, "Describe your idea in at least 20 characters")
    .max(2000, "Description must be 2000 characters or fewer"),
});

export async function createProject(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let projectId: string;

  try {
    const project = await db.project.create({
      data: { ...parsed.data, userId: user.id },
    });
    projectId = project.id;
  } catch (err) {
    console.error("Create project error:", err);
    return {
      error: "Could not create the project. Please check your connection and try again.",
    };
  }

  redirect(`/projects/${projectId}`);
}