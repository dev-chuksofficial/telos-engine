import { resolvePath } from "@/lib/preview";

export type Issue = {
  severity: "error" | "warning";
  file: string;
  message: string;
};

const EXTERNAL = /^(https?:)?\/\/|^(mailto|tel|javascript|data|blob):/i;

const A_HREF = /<a\b[^>]*\bhref\s*=\s*["']([^"']*)["']/gi;
const LINK_TAG = /<link\b[^>]*>/gi;
const SCRIPT_SRC = /<script\b[^>]*\bsrc\s*=\s*["']([^"']*)["']/gi;
const IMG_SRC = /<img\b[^>]*\bsrc\s*=\s*["']([^"']*)["']/gi;

function matches(re: RegExp, text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(re)) out.push(m[1]);
  return out;
}

function target(from: string, url: string): string | null {
  const clean = url.trim();
  if (!clean || clean.startsWith("#") || EXTERNAL.test(clean)) return null;
  const resolved = resolvePath(from, clean);
  return resolved === "" ? "index.html" : resolved;
}

export function checkProject(files: Record<string, string>): Issue[] {
  const issues: Issue[] = [];
  const paths = Object.keys(files);
  const exists = (p: string) => p in files;
  const hasCss = paths.some((p) => p.endsWith(".css"));
  const linkedPages = new Set<string>();

  if (!exists("index.html")) {
    issues.push({
      severity: "error",
      file: "index.html",
      message: "The home page index.html is missing.",
    });
  }

  for (const path of paths) {
    const content = files[path];

    if (content.trim().length === 0) {
      issues.push({ severity: "error", file: path, message: "This file is empty." });
      continue;
    }

    if (path.endsWith(".js")) {
      try {
        new Function(content);
      } catch (err) {
        issues.push({
          severity: "error",
          file: path,
          message: `JavaScript syntax error: ${err instanceof Error ? err.message : "unknown"}.`,
        });
      }
      continue;
    }

    if (!path.endsWith(".html")) continue;

    if (!/<title>[^<]+<\/title>/i.test(content)) {
      issues.push({
        severity: "warning",
        file: path,
        message: "The page has no <title>, so browser tabs and search results show nothing.",
      });
    }
    if (!/name\s*=\s*["']viewport["']/i.test(content)) {
      issues.push({
        severity: "warning",
        file: path,
        message: "The page has no viewport meta tag, so it may look wrong on phones.",
      });
    }

    let linksStylesheet = false;

    for (const tag of content.match(LINK_TAG) ?? []) {
      const href = tag.match(/\bhref\s*=\s*["']([^"']*)["']/i)?.[1];
      if (!href) continue;
      const isStylesheet = /rel\s*=\s*["']?stylesheet/i.test(tag);
      if (isStylesheet) linksStylesheet = true;

      if (EXTERNAL.test(href.trim())) {
        if (isStylesheet) {
          issues.push({
            severity: "warning",
            file: path,
            message: `Loads an external stylesheet (${href}). Published sites work best with local files only.`,
          });
        }
        continue;
      }
      const t = target(path, href);
      if (t && !exists(t)) {
        issues.push({
          severity: "error",
          file: path,
          message: `Broken ${isStylesheet ? "stylesheet" : "file"} link: "${href}" points to ${t}, which does not exist.`,
        });
      }
    }

    if (hasCss && !linksStylesheet) {
      issues.push({
        severity: "warning",
        file: path,
        message: "The page does not link any stylesheet, so it may look unstyled.",
      });
    }

    for (const src of matches(SCRIPT_SRC, content)) {
      if (EXTERNAL.test(src.trim())) {
        issues.push({
          severity: "warning",
          file: path,
          message: `Loads an external script (${src}). It may be blocked or fail offline.`,
        });
        continue;
      }
      const t = target(path, src);
      if (t && !exists(t)) {
        issues.push({
          severity: "error",
          file: path,
          message: `Broken script link: "${src}" points to ${t}, which does not exist.`,
        });
      }
    }

    for (const src of matches(IMG_SRC, content)) {
      if (EXTERNAL.test(src.trim())) {
        if (!/^data:/i.test(src.trim())) {
          issues.push({
            severity: "warning",
            file: path,
            message: `Uses an external image (${src}). It may not load for every visitor.`,
          });
        }
        continue;
      }
      const t = target(path, src);
      if (t && !exists(t)) {
        issues.push({
          severity: "error",
          file: path,
          message: `Broken image link: "${src}" points to ${t}, which does not exist.`,
        });
      }
    }

    for (const href of matches(A_HREF, content)) {
      const t = target(path, href);
      if (!t) continue;
      if (!exists(t)) {
        issues.push({
          severity: "error",
          file: path,
          message: `Broken link: "${href}" points to ${t}, which does not exist.`,
        });
      } else if (t !== path) {
        linkedPages.add(t);
      }
    }
  }

  for (const path of paths) {
    if (path.endsWith(".html") && path !== "index.html" && !linkedPages.has(path)) {
      issues.push({
        severity: "warning",
        file: path,
        message: "No other page links to this page, so visitors cannot reach it.",
      });
    }
  }

  const seen = new Set<string>();
  return issues
    .filter((i) => {
      const key = `${i.severity}|${i.file}|${i.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) =>
      a.severity === b.severity ? a.file.localeCompare(b.file) : a.severity === "error" ? -1 : 1
    );
}

export function issuesToInstruction(issues: Issue[]): string {
  const header =
    "Fix these problems found by the project checker. Change only what is needed and keep the existing design:\n";
  let body = "";
  for (const i of issues) {
    const line = `- ${i.file}: ${i.message}\n`;
    if (header.length + body.length + line.length > 950) break;
    body += line;
  }
  return header + body;
}