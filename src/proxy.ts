import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// JS-readable, non-httpOnly detail the backend defines — presence-only check,
// not validation. Real enforcement happens server-side per request.
const SESSION_COOKIE = "mrm_session";

// TEMPORARY: no backend exists yet anywhere — dev machine or the deployed
// demo — so a real session cookie can never be issued. Always skips the
// auth-cookie redirect so every portal is reachable for review. useMe() has
// a matching bypass (src/hooks/useMe.ts) that returns a mock identity
// instead of calling /me. Remove both once a real backend is wired up.
const DEV_AUTH_BYPASS = true;

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";

type Realm = "public" | "admin" | "tenant";

function resolveRealm(host: string): Realm {
  const hostname = host.split(":")[0];

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "public"; // dev: all realms reachable by path, see below
  }

  if (!ROOT_DOMAIN || hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    return "public";
  }
  if (hostname === `admin.${ROOT_DOMAIN}`) {
    return "admin";
  }
  return "tenant";
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const isLocalDev = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  // TEMPORARY: without NEXT_PUBLIC_ROOT_DOMAIN configured (e.g. a Vercel demo
  // deploy on its default *.vercel.app domain, no custom subdomains set up),
  // there's no real subdomain routing to enforce — treat it the same as
  // localhost. Set NEXT_PUBLIC_ROOT_DOMAIN once real subdomains exist.
  const isUnroutedHost = isLocalDev || !ROOT_DOMAIN;
  const realm = resolveRealm(host);

  // Realm guard: a host may only render its own portal's paths. Skipped
  // entirely when there's no real subdomain routing to enforce.
  if (!isUnroutedHost) {
    if (realm === "public" && (pathname.startsWith("/admin") || pathname.startsWith("/dashboard"))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (realm === "admin" && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (realm === "tenant" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Auth gating at the edge: cookie-presence redirect only, to avoid a flash
  // of authenticated-looking chrome. Client-side AuthGate + server-side
  // enforcement are the real checks.
  const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/dashboard");
  if (isProtected && !DEV_AUTH_BYPASS && !request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude /api/*, websocket paths, static assets, and image optimization.
    "/((?!api|ws|_next/static|_next/image|favicon.ico).*)",
  ],
};
