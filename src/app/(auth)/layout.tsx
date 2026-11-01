import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory-100 px-6 py-12">
      <Link
        href="/"
        className="mb-10 font-serif text-3xl font-semibold tracking-wide"
      >
        TELOS <span className="text-gold-500">ENGINE</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}