import { requireUser } from "@/lib/dal";
import { AppHeader } from "@/components/layout/AppHeader";
import { NewProjectForm } from "@/components/projects/NewProjectForm";

export default async function NewProjectPage() {
  await requireUser();

  return (
    <div className="min-h-screen bg-ivory-100">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
          New project
        </p>
        <h1 className="mt-3 font-serif text-5xl font-semibold">
          What would you like to build?
        </h1>
        <p className="mt-4 mb-10 text-navy-900/70">
          The more clearly you describe it, the better Telos Engine can plan it.
        </p>
        <NewProjectForm />
      </main>
    </div>
  );
}