import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/dal";
import { architectureSchema, requirementsSchema } from "@/lib/ai/schemas";
import { generateArchitecture } from "@/app/actions/architecture";
import { AppHeader } from "@/components/layout/AppHeader";
import { AnalyzeButton } from "@/components/projects/AnalyzeButton";
import { RequirementsView } from "@/components/projects/RequirementsView";
import { ArchitectureView } from "@/components/projects/ArchitectureView";
import { BuildPanel } from "@/components/projects/BuildPanel";
import { AiActionButton } from "@/components/ui/AiActionButton";
import { ButtonLink } from "@/components/ui/Button";
import { DeployPanel } from "@/components/deploy/DeployPanel";

export const maxDuration = 300;

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ANALYZED: "Analyzed",
  BUILDING: "Building",
  READY: "Ready",
  DEPLOYED: "Deployed",
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;

  const [project, fileCount] = await Promise.all([
    db.project.findFirst({ where: { id, userId } }),
    db.projectFile.count({ where: { projectId: id } }),
  ]);

  if (!project) notFound();

  const suggestedSlug = project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

  const parsedRequirements = requirementsSchema.safeParse(project.requirements);
  const requirements = parsedRequirements.success ? parsedRequirements.data : null;

  const parsedArchitecture = architectureSchema.safeParse(project.architecture);
  const architecture = parsedArchitecture.success ? parsedArchitecture.data : null;

  return (
    <div className="min-h-screen bg-ivory-100">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-gold-600 hover:underline"
        >
          &larr; Back to dashboard
        </Link>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <h1 className="font-serif text-5xl font-semibold">{project.name}</h1>
          <span className="rounded-sm border border-gold-500 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold-600">
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
        </div>

        <section className="mt-10 rounded-sm border border-ivory-200 bg-ivory-50 p-8">
          <h2 className="font-serif text-2xl font-semibold">Your idea</h2>
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-navy-900/80">
            {project.description}
          </p>
        </section>

        {requirements ? (
          <>
            <RequirementsView data={requirements} />

            {architecture ? (
              <>
                <div className="mt-14 border-t border-navy-900/10 pt-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
                    Stage 2
                  </p>
                  <h2 className="mt-2 font-serif text-4xl font-semibold">
                    Architecture
                  </h2>
                </div>
                <ArchitectureView data={architecture} />
                <div className="mt-10">
                  <AiActionButton
                    action={generateArchitecture}
                    projectId={project.id}
                    label="Regenerate architecture"
                    pendingLabel="Designing architecture..."
                  />
                </div>

                <div className="mt-14 border-t border-navy-900/10 pt-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
                    Stage 3
                  </p>
                  <h2 className="mt-2 font-serif text-4xl font-semibold">
                    Build
                  </h2>
                </div>
                <section className="mt-6 rounded-sm border border-ivory-200 bg-ivory-50 p-8">
                  <p className="mb-6 leading-relaxed text-navy-900/80">
                    Telos Engine will generate the {architecture.files.length}{" "}
                    planned files one by one, then open a workspace where you
                    can browse, edit and preview them.
                  </p>
                  {fileCount > 0 && (
                    <div className="mb-6 flex flex-wrap gap-3">
                      <ButtonLink href={`/projects/${project.id}/workspace`}>
                        Open workspace ({fileCount} files)
                      </ButtonLink>
                      <a
                        href={`/api/projects/${project.id}/export`}
                        className="inline-flex items-center justify-center rounded-sm border border-navy-900 px-6 py-3 text-sm font-semibold tracking-wide text-navy-900 transition-colors hover:bg-navy-900 hover:text-ivory-50"
                      >
                        Download ZIP
                      </a>
                    </div>
                  )}
                  <BuildPanel
                    projectId={project.id}
                    hasFiles={fileCount > 0}
                    label={fileCount > 0 ? "Rebuild project" : "Build my project"}
                  />
                </section>

                {fileCount > 0 && (
                  <>
                    <div className="mt-14 border-t border-navy-900/10 pt-10">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
                        Stage 4
                      </p>
                      <h2 className="mt-2 font-serif text-4xl font-semibold">
                        Deploy
                      </h2>
                    </div>
                    <section className="mt-6 rounded-sm border border-ivory-200 bg-ivory-50 p-8">
                      <p className="mb-6 leading-relaxed text-navy-900/80">
                        Publish your site to its own address. Anyone with the
                        link can open it.
                      </p>
                      <DeployPanel
                        projectId={project.id}
                        currentSlug={project.subdomain}
                        suggestedSlug={suggestedSlug}
                      />
                    </section>
                  </>
                )}
              </>
            ) : (
              <section className="mt-10 rounded-sm border border-dashed border-navy-900/20 p-8">
                <h2 className="font-serif text-2xl font-semibold">
                  Architecture recommendation
                </h2>
                <p className="mt-3 mb-6 text-navy-900/70">
                  Telos Engine will propose the tech stack, the files to
                  generate, and a build plan before any code is written.
                </p>
                <AiActionButton
                  action={generateArchitecture}
                  projectId={project.id}
                  label="Design the architecture"
                  pendingLabel="Designing architecture..."
                />
              </section>
            )}

            <div className="mt-14 border-t border-navy-900/10 pt-8">
              <AnalyzeButton
                projectId={project.id}
                label="Run requirements analysis again"
              />
            </div>
          </>
        ) : (
          <section className="mt-6 rounded-sm border border-dashed border-navy-900/20 p-8">
            <h2 className="font-serif text-2xl font-semibold">
              Requirements analysis
            </h2>
            <p className="mt-3 mb-6 text-navy-900/70">
              Telos Engine will read your idea and turn it into structured
              requirements: roles, features, pages and data.
            </p>
            <AnalyzeButton projectId={project.id} label="Analyze my idea" />
          </section>
        )}
      </main>
    </div>
  );
}