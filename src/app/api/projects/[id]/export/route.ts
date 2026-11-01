import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { createZip } from "@/lib/zip";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return new Response("Please log in.", { status: 401 });

    const { id } = await params;

    const [project, files] = await Promise.all([
      db.project.findFirst({
        where: { id, userId },
        select: { name: true },
      }),
      db.projectFile.findMany({
        where: { projectId: id },
        select: { path: true, content: true },
        orderBy: { path: "asc" },
      }),
    ]);

    if (!project) return new Response("Project not found.", { status: 404 });
    if (files.length === 0) {
      return new Response("Build the project before exporting it.", {
        status: 404,
      });
    }

    const folder =
      project.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "telos-project";

        const readme = [
      project.name,
      "",
      "Built with Telos Engine.",
      "",
      "How to open this site:",
      "1. Extract this ZIP file.",
      "2. Open index.html in any web browser.",
      "",
      "How to publish it:",
      "Upload the extracted files to any static web host, for example",
      "Netlify, Vercel, GitHub Pages or a normal web hosting account.",
      "",
    ].join("\n");

    const zip = createZip([
      { path: `${folder}/README.txt`, content: readme },
      ...files.map((f) => ({
        path: `${folder}/${f.path}`,
        content: f.content,
      })),
    ]);

    return new Response(new Blob([zip as BlobPart]), {
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${folder}.zip"`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return new Response("Could not create the ZIP file.", { status: 500 });
  }
}