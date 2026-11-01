import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-ivory-200 bg-ivory-100/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-wide">
          TELOS <span className="text-gold-500">ENGINE</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a href="#process" className="hover:text-gold-600">
            How it works
          </a>
          <a href="#features" className="hover:text-gold-600">
            Features
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ButtonLink href="/login" variant="ghost">
            Log in
          </ButtonLink>
          <ButtonLink href="/register">Get started</ButtonLink>
        </div>
      </div>
    </header>
  );
}