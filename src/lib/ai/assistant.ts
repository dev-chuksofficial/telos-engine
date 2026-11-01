import { z } from "zod";
import { callAI, extractJson } from "@/lib/ai/provider";

const responseSchema = z.object({
  summary: z.string(),
  changes: z
    .array(
      z.object({
        path: z.string(),
        content: z.string(),
      })
    )
    .max(8),
});

export type AssistantResult = z.infer<typeof responseSchema>;

const SYSTEM_PROMPT = `You are the AI coding assistant inside Telos Engine. You edit the files of a static website prototype (HTML, CSS and vanilla JavaScript) according to the user's instruction.

You receive the current files and one instruction. Respond with ONE JSON object only. No markdown, no code fences, no commentary outside the JSON:
{
  "summary": string,
  "changes": [{ "path": string, "content": string }]
}

Rules:
- "changes" lists ONLY the files you modify or create. Each "content" must be the COMPLETE new content of that file, never a fragment or a diff.
- Change as little as needed. Keep everything the user did not ask to change exactly as it is.
- Static site only: no frameworks, no build tools, no npm packages, no external resources (no CDN links, no Google Fonts, no remote images). Do not use localStorage, sessionStorage or cookies.
- Keep the existing design language (navy, ivory and muted gold, classic and professional) unless the user asks for something different.
- When you create a new page, copy the navigation, header and footer structure from an existing page, use the shared stylesheet and script with correct RELATIVE paths, and add a link to the new page in the navigation of every existing HTML page you can reasonably update.
- Links between files must use correct relative paths (a file inside "pages/" links to "../css/styles.css" and "../index.html").
- Only create files ending in .html, .css or .js, using letters, numbers, dashes, underscores, dots and slashes in the path.
- If the instruction is unclear, unsafe, or impossible for a static site, return an empty "changes" array and explain briefly in "summary".
- "summary" is 1 to 3 plain sentences saying what you changed or why you changed nothing.`;

type FileItem = { path: string; content: string };
type HistoryItem = { role: string; content: string };

type Input = {
  name: string;
  description: string;
  files: FileItem[];
  instruction: string;
  history: HistoryItem[];
  memories: string[];
};
export async function requestChanges({
  name,
  description,
  files,
    instruction,
  history,
  memories,
}: Input): Promise<AssistantResult> {
  const fileBlock = files
    .map((f) => `=== ${f.path} ===\n${f.content}`)
    .join("\n\n");

  const historyBlock = history.length
    ? "Recent conversation:\n" +
      history.map((m) => `${m.role}: ${m.content}`).join("\n")
    : "";

  const memoryBlock = memories.length
    ? "Project notes (the owner's standing decisions; always follow them):\n" +
      memories.map((m) => `- ${m}`).join("\n")
    : "";

  const prompt = [
    `Project name: ${name}`,
    `Project idea:\n${description}`,
    memoryBlock,
    `Project idea:\n${description}`,
    `Current files:\n\n${fileBlock}`,
    historyBlock,
    `Instruction:\n${instruction}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const text = await callAI({
    system: SYSTEM_PROMPT,
    prompt,
    maxTokens: 30000,
    timeoutMs: 120_000,
    json: true,
  });

  const parsed = responseSchema.safeParse(extractJson(text));
  if (!parsed.success) {
    console.error("Assistant validation failed:", parsed.error.flatten());
    throw new Error("The AI response was not in the expected format. Please try again.");
  }
  return parsed.data;
}