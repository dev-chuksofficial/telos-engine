import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory-100 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
        Error 404
      </p>
      <h1 className="mt-3 font-serif text-5xl font-semibold">Page not found</h1>
      <p className="mt-4 max-w-md leading-relaxed text-navy-900/70">
        The page you are looking for does not exist, or it belongs to another
        account.
      </p>
      <div className="mt-8">
        <ButtonLink href="/dashboard">Go to dashboard</ButtonLink>
      </div>
    </main>
  );
}