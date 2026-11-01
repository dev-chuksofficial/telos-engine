import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/dal";
import { siteUrl } from "@/lib/site-url";
import { AppHeader } from "@/components/layout/AppHeader";
import { ButtonLink } from "@/components/ui/Button";
import { DeleteProjectButton } from "@/components/projects/DeleteProjectButton";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ANALYZED: "Analyzed",
  BUILDING: "Building",
  READY: "Ready",
  DEPLOYED: "Live",
};

export default async function DashboardPage() {
  const userId = await requireUserId();

  const [user, projects] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true } }),
    db.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-ivory-100">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
              Dashboard
            </p>
            <h1 className="mt-3 font-serif text-5xl font-semibold">
              Welcome, {user.name}
            </h1>
          </div>
          <ButtonLink href="/projects/new">New project</ButtonLink>
        </div>

        <h2 className="mt-16 font-serif text-3xl font-semibold">Your projects</h2>

        {projects.length === 0 ? (
          <div className="mt-6 rounded-sm border border-dashed border-navy-900/20 p-12 text-center">
            <p className="font-serif text-2xl">No projects yet</p>
            <p className="mt-2 text-navy-900/70">
              Describe your first idea and Telos Engine will take it from there.
            </p>
            <div className="mt-6">
              <ButtonLink href="/projects/new">Create your first project</ButtonLink>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex flex-col rounded-sm border border-ivory-200 bg-ivory-50 transition-colors hover:border-gold-500"
              >
                <Link href={`/projects/${p.id}`} className="block flex-1 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-serif text-2xl font-semibold">{p.name}</h3>
                    <span className="shrink-0 rounded-sm border border-gold-500 px-2 py-1 text-xs font-semibold uppercase tracking-widest text-gold-600">
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-navy-900/70">
                    {p.description}
                  </p>
                  <p className="mt-4 text-xs text-navy-900/50">
                    Updated{" "}
                    {p.updatedAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "Africa/Lagos",
                    })}
                  </p>
                </Link>

                <div className="flex items-center justify-between border-t border-ivory-200 px-6 py-3 text-xs font-semibold">
                  {p.status === "DEPLOYED" && p.subdomain ? (
                    <a
                      href={siteUrl(p.subdomain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold-600 hover:underline"
                    >
                      View live site
                    </a>
                  ) : (
                    <span className="text-navy-900/40">Not published</span>
                  )}
                  <DeleteProjectButton projectId={p.id} name={p.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}