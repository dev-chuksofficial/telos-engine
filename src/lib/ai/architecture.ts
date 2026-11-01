import { callAI, extractJson } from "@/lib/ai/provider";
import {
  architectureSchema,
  type Architecture,
  type Requirements,
} from "@/lib/ai/schemas";

const SYSTEM_PROMPT = `You are the software architect inside Telos Engine, a platform that turns ideas into working websites.

You receive a project idea and its analyzed requirements. Recommend an architecture.

Important context: the MVP builder of Telos Engine generates a STATIC website prototype (HTML, CSS and vanilla JavaScript files, no server). Demo data for the prototype is kept in the browser. The "stack" you recommend is the proper production stack for later; the "files" list is what the MVP builder will actually generate now.

Rules:
- Respond with ONE JSON object only. No markdown, no code fences, no commentary.
- Be realistic and compact: at most 6 stack layers, 12 files, 8 build steps, 5 risks and 5 future upgrades.
- Files must use relative paths such as "index.html", "css/styles.css", "js/app.js", "pages/login.html". Include only files needed for the MVP features.
- Keep every description to one sentence.
- Use plain, professional language.

The JSON must have exactly these keys:
{
  "overview": string,
  "stack": [{ "layer": string, "choice": string, "reason": string }],
  "files": [{ "path": string, "purpose": string }],
  "dataFlow": string,
  "buildPlan": string[],
  "risks": string[],
  "futureUpgrades": string[]
}`;

export async function designArchitecture(
  name: string,
  description: string,
  requirements: Requirements
): Promise<Architecture> {
  const text = await callAI({
    system: SYSTEM_PROMPT,
    prompt: `Project name: ${name}\n\nProject idea:\n${description}\n\nAnalyzed requirements (JSON):\n${JSON.stringify(requirements)}`,
    maxTokens: 4096,
  });

  const parsed = architectureSchema.safeParse(extractJson(text));
  if (!parsed.success) {
    console.error("Architecture validation failed:", parsed.error.flatten());
    throw new Error("The AI response was not in the expected format. Please try again.");
  }
  return parsed.data;
}