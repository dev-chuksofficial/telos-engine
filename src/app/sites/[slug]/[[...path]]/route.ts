import { z } from "zod";
import { db } from "@/lib/db";

const snapshotSchema = z.array(
  z.object({ path: z.string(), content: z.string() })
);

const TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
};

function page(status: number, title: string, message: string) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#faf7f0;color:#0b1f3a;font-family:Georgia,serif;text-align:center"><main style="padding:24px"><h1 style="font-size:2.5rem;margin:0 0 12px">${title}</h1><p style="font-family:system-ui,sans-serif;color:#0b1f3acc">${message}</p></main></body></html>`;
  return new Response(html, {
    status,
    headers: { "content-type": TYPES.html },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; path?: string[] }> }
) {
  try {
    const { slug, path } = await params;

    const project = await db.project.findUnique({
      where: { subdomain: slug },
      select: { id: true },
    });
    if (!project) {
      return page(404, "Site not found", "This address is not published yet.");
    }

    const version = await db.projectVersion.findFirst({
      where: { projectId: project.id, label: { startsWith: "Deployed" } },
      orderBy: { createdAt: "desc" },
    });
    const snapshot = snapshotSchema.safeParse(version?.snapshot);
    if (!version || !snapshot.success) {
      return page(404, "Site not found", "This site has no published version.");
    }

    let requested = path && path.length > 0 ? path.join("/") : "index.html";
    if (requested.endsWith("/")) requested += "index.html";

    const file = snapshot.data.find((f) => f.path === requested);
    if (!file) {
      return page(404, "Page not found", "This page does not exist on the site.");
    }

    const ext = requested.split(".").pop() ?? "";
    return new Response(file.content, {
      headers: {
        "content-type": TYPES[ext] ?? "text/plain; charset=utf-8",
        "cache-control": "no-cache",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Site serve error:", err);
    return page(500, "Something went wrong", "Please try again in a moment.");
  }
}