import { callAI } from "@/lib/ai/provider";
import type { Architecture, Requirements } from "@/lib/ai/schemas";

const SYSTEM_PROMPT = `You are a senior front-end developer inside Telos Engine.
You write ONE file of a static website prototype at a time.
Output ONLY the raw content of the requested file. No markdown code fences, no explanations.

Rules:
- Static site only: plain HTML, CSS and vanilla JavaScript. No frameworks, no build tools, no npm packages.
- Do NOT use external resources: no CDN links, no Google Fonts, no remote images. Use Georgia for headings and system-ui for body text. Draw icons with CSS or simple inline SVG.
- Do NOT use localStorage, sessionStorage or cookies. Keep any data in JavaScript variables.
- Design: classic and professional. Navy (#0b1f3a, #12305a), ivory (#faf7f0, #f1ebdd), muted gold (#b08d57, #c9a96e). Generous spacing, clean typography, fully responsive.
- Use realistic demo data suited to the project.
- Link files with correct RELATIVE paths computed from the location of the current file (a file inside "pages/" links to "../css/styles.css" and "../index.html"). Only link to files that exist in the provided file list.
- Every HTML page must be a complete document that links the shared stylesheet and, if it exists in the file list, the shared script, and repeats the same navigation.
- Put realistic demo content (tables, cards, forms) directly in the HTML so each page looks complete without JavaScript. JavaScript is only for light interactivity.
- Stay compact: CSS under about 300 lines, each HTML page under about 150 lines, JavaScript under about 250 lines.`;

type ExistingFile = { path: string; content: string };

type Input = {
  name: string;
  description: string;
  requirements: Requirements;
  architecture: Architecture;
  file: { path: string; purpose: string };
  existing: ExistingFile[];
};

const MAX_EXISTING_CHARS = 12000;

function stripFences(text: string): string {
  return text
    .replace(/^\s*```[a-zA-Z]*\s*\n/, "")
    .replace(/\n?```\s*$/, "")
    .trim();
}

function kindHint(path: string, allPaths: string[]): string {
  if (path.endsWith(".css")) {
    return "Write the complete shared stylesheet that every page will use: CSS variables, layout, navigation, buttons, cards, tables, forms, badges, dashboard grids, and responsive rules. Keep class names simple and descriptive.";
  }
  if (path.endsWith(".js")) {
    return "Write the shared script. Read the HTML pages above and attach behavior to the elements that exist in them (tab switching, table search and filter, form feedback, mobile menu). Guard every behavior so it only runs if its element exists on the current page.";
  }
  if (path.endsWith(".html")) {
    const css = allPaths.find((p) => p.endsWith(".css"));
    const js = allPaths.find((p) => p.endsWith(".js"));
    return `Write the complete HTML page.${css ? ` Use ONLY class names defined in ${css}.` : ""}${js ? ` Link ${js} at the end of the body; it will be written after the pages, so mark interactive elements with clear ids, classes and data- attributes.` : ""}`;
  }
  return "Write the complete file content.";
}

export async function generateFileContent({
  name,
  description,
  requirements,
  architecture,
  file,
  existing,
}: Input): Promise<string> {
  const mvp = requirements.features
    .filter((f) => f.priority === "MVP")
    .map((f) => `- ${f.name}: ${f.description}`)
    .join("\n");

  const roles = requirements.userRoles
    .map((r) => `- ${r.name}: ${r.description}`)
    .join("\n");

  const allFiles = architecture.files
    .map((f) => `- ${f.path}: ${f.purpose}`)
    .join("\n");

  const allPaths = architecture.files.map((f) => f.path);

  const existingBlock = existing.length
    ? "Already written files (stay consistent with them):\n\n" +
      existing
        .map(
          (e) =>
            `=== ${e.path} ===\n${e.content.slice(0, MAX_EXISTING_CHARS)}`
        )
        .join("\n\n")
    : "";

  const prompt = [
    `Project name: ${name}`,
    `Project idea:\n${description}`,
    `MVP features:\n${mvp}`,
    `User roles:\n${roles}`,
    `All files in this project:\n${allFiles}`,
    existingBlock,
    `Write this file now: ${file.path}\nPurpose: ${file.purpose}\n${kindHint(file.path, allPaths)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const text = await callAI({
    system: SYSTEM_PROMPT,
    prompt,
    maxTokens: 12000,
    timeoutMs: 90_000,
    json: false,
  });

  const content = stripFences(text);
  if (content.length < 20) {
    throw new Error("The AI returned an empty file. Please try again.");
  }
  return content;
}