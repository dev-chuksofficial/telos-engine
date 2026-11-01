import { NextResponse, type NextRequest } from "next/server";

const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000").toLowerCase();

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase();

  if (!host.endsWith(`.${ROOT}`)) return NextResponse.next();

  const slug = host.slice(0, -(ROOT.length + 1));
  if (!/^[a-z0-9-]{3,40}$/.test(slug) || slug === "www") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/sites/${slug}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico).*)"],
};