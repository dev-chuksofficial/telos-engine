import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline-light" | "ghost";

type Props = {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

const styles: Record<Variant, string> = {
  primary: "bg-gold-500 text-navy-950 hover:bg-gold-400",
  secondary:
    "border border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-ivory-50",
  "outline-light":
    "border border-ivory-200 text-ivory-50 hover:bg-ivory-50 hover:text-navy-900",
  ghost: "text-navy-900 hover:text-gold-600",
};

export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
}: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-sm px-6 py-3 text-sm font-semibold tracking-wide transition-colors ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}