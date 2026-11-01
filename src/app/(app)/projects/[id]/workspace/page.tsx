import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/dal";
import { AppHeader } from "@/components/layout/AppHeader";
import { Workspace } from "@/components/workspace/Workspace";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;

  const [project, files, recent, versionRows, memories] = await Promise.all([
    db.project.findFirst({ where: { id, userId } }),
    db.projectFile.findMany({
      where: { projectId: id },
      orderBy: { path: "asc" },
      select: { path: true, content: true },
    }),
    db.chatMessage.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, role: true, content: true },
    }),
    db.projectVersion.findMany({
      where: { projectId: id, label: { startsWith: "Version: " } },
      orderBy: { createdAt: "desc" },
      select: { id: true, label: true, createdAt: true },
    }),
    db.projectMemory.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true, value: true },
    }),
  ]);

  if (!project) notFound();
  if (files.length === 0) redirect(`/projects/${project.id}`);

  const messages = recent.reverse();
  const versions = versionRows.map((v) => ({
    id: v.id,
    label: v.label,
    createdAt: v.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-ivory-100">
      <AppHeader />
      <main className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={`/projects/${project.id}`}
              className="text-sm font-semibold text-gold-600 hover:underline"
            >
              &larr; Back to project
            </Link>
            <h1 className="mt-2 font-serif text-4xl font-semibold">
              {project.name}
            </h1>
          </div>
          <a
            href={`/api/projects/${project.id}/export`}
            className="inline-flex items-center justify-center rounded-sm border border-navy-900 px-6 py-3 text-sm font-semibold tracking-wide text-navy-900 transition-colors hover:bg-navy-900 hover:text-ivory-50"
          >
            Download ZIP
          </a>
        </div>
        <Workspace
          projectId={project.id}
          initialFiles={files}
          initialMessages={messages}
          initialVersions={versions}
          initialMemories={memories}
        />
      </main>
    </div>
  );
}