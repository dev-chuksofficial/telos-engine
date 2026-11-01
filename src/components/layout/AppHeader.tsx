import Link from "next/link";
import { logout } from "@/app/actions/auth";

export function AppHeader() {
  return (
    <header className="border-b border-navy-800 bg-navy-900 text-ivory-50">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link
          href="/dashboard"
          className="font-serif text-2xl font-semibold tracking-wide"
        >
          TELOS <span className="text-gold-400">ENGINE</span>
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm font-semibold text-ivory-200 transition-colors hover:text-gold-400"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}