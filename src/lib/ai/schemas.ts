import { z } from "zod";

export const requirementsSchema = z.object({
  summary: z.string(),
  targetUsers: z.array(z.string()),
  userRoles: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    })
  ),
  features: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      priority: z.enum(["MVP", "LATER"]),
    })
  ),
  pages: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
    })
  ),
  dataEntities: z.array(
    z.object({
      name: z.string(),
      fields: z.array(z.string()),
    })
  ),
  assumptions: z.array(z.string()),
  outOfScope: z.array(z.string()),
});

export type Requirements = z.infer<typeof requirementsSchema>;
export const architectureSchema = z.object({
  overview: z.string(),
  stack: z.array(
    z.object({
      layer: z.string(),
      choice: z.string(),
      reason: z.string(),
    })
  ),
  files: z.array(
    z.object({
      path: z.string(),
      purpose: z.string(),
    })
  ),
  dataFlow: z.string(),
  buildPlan: z.array(z.string()),
  risks: z.array(z.string()),
  futureUpgrades: z.array(z.string()),
});

export type Architecture = z.infer<typeof architectureSchema>;