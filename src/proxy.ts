import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// JS-readable, non-httpOnly detail the backend defines — presence-only check,
// not validation. Real enforcement happens server-side per request.
const SESSION_COOKIE = "mrm_session";

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
  const hostname = host.split(":")[0];
  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
  const isShareTunnel =
    hostname.endsWith(".trycloudflare.com") ||
    hostname.endsWith(".loca.lt") ||
    hostname.endsWith(".ngrok-free.dev") ||
    hostname.endsWith(".ngrok-free.app") ||
    hostname.endsWith(".ngrok.app") ||
    hostname.endsWith(".ngrok.io");
  const isLocalDev =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    isIpv4 ||
    isShareTunnel;
  // Soft-launch / tunnel / LAN: no real subdomain routing — path decides realm.
  const isUnroutedHost = isLocalDev || !ROOT_DOMAIN || ROOT_DOMAIN === "localhost";
  const realm = isUnroutedHost ? "public" : resolveRealm(host);

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

  // Cookie-presence redirect only — AuthGate + server-side checks are the real gate.
  const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/dashboard");
  if (isProtected && !request.cookies.has(SESSION_COOKIE)) {
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
