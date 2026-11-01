import { callAI, extractJson } from "@/lib/ai/provider";
import { requirementsSchema, type Requirements } from "@/lib/ai/schemas";

const SYSTEM_PROMPT = `You are the requirements analyst inside Telos Engine, a platform that turns ideas into working websites.

Read the user's project idea and produce a clear, realistic requirements document.

Rules:
- Respond with ONE JSON object only. No markdown, no code fences, no commentary.
- Mark a feature "MVP" only if it is needed for a first working version that can be built as a static website. Everything else is "LATER".
- Keep names short and descriptions to one sentence.
- Use plain, professional language.
- Do not invent features the user did not imply. List guesses under "assumptions".

The JSON must have exactly these keys:
{
  "summary": string,
  "targetUsers": string[],
  "userRoles": [{ "name": string, "description": string }],
  "features": [{ "name": string, "description": string, "priority": "MVP" | "LATER" }],
  "pages": [{ "name": string, "purpose": string }],
  "dataEntities": [{ "name": string, "fields": string[] }],
  "assumptions": string[],
  "outOfScope": string[]
}`;

export async function analyzeRequirements(
  name: string,
  description: string
): Promise<Requirements> {
  const text = await callAI({
    system: SYSTEM_PROMPT,
    prompt: `Project name: ${name}\n\nProject idea:\n${description}`,
    maxTokens: 8192,
  });

  const parsed = requirementsSchema.safeParse(extractJson(text));
  if (!parsed.success) {
    console.error("Requirements validation failed:", parsed.error.flatten());
    throw new Error("The AI response was not in the expected format. Please try again.");
  }
  return parsed.data;
}