# Project Architecture Guide

This document describes the target architecture for this Next.js project. It is
modeled after a working multi-tenant SaaS platform (three realms: public
marketing site, platform admin portal, tenant admin portal). Follow it when
scaffolding folders, wiring auth, building the sidebar/navbar shell, theming,
and integrating the API. Client-supplied HTML/Figma files define visual design;
this document defines structure and wiring.

---

## 1. Route groups

Three Next.js route groups, one per realm. Route groups (`(name)`) never
appear in the URL — they only group layouts.

```
src/app/
├── layout.tsx                     # Root layout — fonts, global CSS, minimal providers only
├── globals.css
│
├── (public)/                      # Marketing site + auth pages
│   ├── layout.tsx
│   ├── error.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   ├── page.tsx                   # /
│   ├── pricing/page.tsx
│   ├── features/page.tsx
│   ├── contact/page.tsx
│   ├── login/page.tsx
│   ├── signup/...
│   ├── components/                # Page sections, not routes
│   ├── modules/
│   └── types/
│
├── (admin)/                       # Platform admin portal — one operator org managing all tenants
│   ├── layout.tsx
│   ├── error.tsx / loading.tsx / not-found.tsx
│   ├── components/
│   ├── modules/
│   ├── types/
│   └── admin/
│       ├── page.tsx               # /admin
│       ├── tenants/page.tsx
│       ├── subscriptions/page.tsx
│       ├── billing/page.tsx
│       ├── roles/page.tsx
│       ├── compliance/page.tsx
│       ├── support/page.tsx
│       ├── reports/page.tsx
│       └── settings/page.tsx
│
└── (tenant)/                      # Tenant admin portal — one org's operational dashboard
    ├── layout.tsx
    ├── error.tsx / loading.tsx / not-found.tsx
    ├── components/
    ├── modules/
    ├── types/
    └── dashboard/
        ├── page.tsx               # /dashboard
        ├── <feature>/page.tsx     # one folder per sidebar nav item
        └── <feature>/[id]/page.tsx  # detail/tabbed views, e.g. training/[trainingId]
```

Shared code lives outside `app/`:

```
src/
├── components/
│   ├── ui/                        # Base primitives (button, input, dialog, table...) — shadcn-style
│   └── shared/                    # Cross-realm composites: Navbar, Sidebar, ThemeProvider,
│                                   # SidebarCollapseProvider, PageHeading, StatCard, tables, etc.
├── lib/
│   ├── auth/                      # authService, session helpers
│   ├── permissions/                # RBAC: can(), isTenant(), isPlatform(), module gating
│   ├── api/                        # http client, envelope unwrap, csrf, error types
│   └── utils/
├── hooks/                          # useMe, useAuth, useDebounce, etc.
├── providers/                      # ReactQueryProvider, MainProvider (toast/tooltip)
├── types/                          # Global types + generated OpenAPI types
└── middleware.ts / proxy.ts        # Host-based realm routing
```

**Rule:** a route group's `components/`, `modules/`, `api/`, `types/` folders
are organizational only — they never contain `page.tsx`/`route.ts` and so
never produce routes. Keep realm-specific UI inside its own route group;
promote something to `src/components/shared` only once a second realm needs
it.

---

## 2. Realm separation & routing (host-based)

If the product is single-tenant (no subdomain-per-tenant requirement), skip
this section and gate purely by path + auth. If it's multi-tenant like the
reference project, each realm is bound to a host:

- `www.<domain>` → public site. `/admin/*` and `/dashboard/*` redirect to `/login`.
- `admin.<domain>` → platform admin. Serves `/admin/*`. Anything under `/dashboard/*` redirects to `/admin`.
- `<tenant>.<domain>` → tenant portal. Serves `/dashboard/*`. Anything under `/admin/*` redirects to `/dashboard`.
- `localhost` (dev) → all realms reachable by path (`/`, `/admin`, `/dashboard`), subdomain checks skipped.

Implement this in `src/proxy.ts` (or `middleware.ts`) using `NextRequest`'s
`Host` header. This is a **realm guard**, not authentication — it decides
which portal a host may render, not whether the visitor is logged in.
Exclude `/api/*` and any websocket path from the matcher; those are proxied
straight to the backend and must keep the original host/cookies intact.

**Auth gating at the edge:** additionally check for the session cookie's
presence (not validity — that's a JS-readable, non-httpOnly detail your
backend defines) on protected path prefixes (`/admin`, `/dashboard`) and
redirect to `/login` if absent, before any React renders. This avoids a
flash of authenticated-looking chrome before the client-side auth check
catches an unauthenticated visitor. It is a UX optimization only — real
enforcement still happens server-side per request (§4).

---

## 3. Authentication layers

Five layers, each catching what the one before it can't:

1. **Edge realm/auth guard** (`proxy.ts`) — host routing + cookie-presence redirect. Fast, coarse.
2. **Session cookie** — `httpOnly`, set by the backend on login. Never read/stored by JS, never in `localStorage`. No JWT or user object persisted client-side.
3. **Identity fetch** — a single `GET /me` endpoint is the sole source of identity/permissions/tenant scope. Cache it (React Query) so it's fetched once and reused.
4. **Client auth gate component** — wraps each protected layout's content:
   - Shows a skeleton while `/me` is pending.
   - Redirects to `/login` if `/me` errors, returns null, or the identity's realm doesn't match the portal it's mounted in.
   - **Gate the entire shell (sidebar + navbar + content), not just the page content** — gating only `{children}` lets the sidebar/navbar flash before the redirect fires. This was a known flicker bug in the reference project; don't repeat it.
5. **Server-side enforcement** — every real authorization decision is re-checked by the backend on each request. Client checks are UX only; treat them as such and never skip layer 5 reasoning when reviewing a feature for security.

**Global 401 handling:** a response interceptor (Axios or fetch) on `401` clears the query cache and redirects to `/login` — catches session expiry mid-session, not just on initial load.

---

## 4. Sidebar & Navbar structure

One `Sidebar` component per portal (`AdminSidebar`, `TenantSidebar`) built on
a shared `<Sidebar navItems={...} />` primitive in `components/shared/`:

```ts
type SidebarNavItem = {
  label: string;
  href: string;
  icon: ComponentType<IconProps>;
  permission?: string | string[]; // any one grants visibility
  module?: ModuleKey; // must be in the tenant's active plan
};
```

- Nav items are declarative data (an array), filtered at render time by the
  current user's permissions/plan — never hardcode visibility with `if`
  chains scattered through JSX.
- **Collapse state** lives in a small context provider (`SidebarCollapseProvider`)
  shared across the whole authenticated shell, so the sidebar and any layout
  math (`lg:p-[10px]` offsets, etc.) stay in sync.
- **Mobile:** sidebar becomes an off-canvas drawer below `lg:`, triggered by
  a hamburger button fixed to the corner, with a dismissible scrim overlay
  and a fade/slide transition. Desktop layout (`lg:` and up) must match the
  Figma/HTML design exactly and is never adjusted to accommodate small
  screens — only the collapse mechanism below `lg:` is your call to design.
- **Navbar** is shared across admin/tenant (`<Navbar portal="admin" | "tenant" />`),
  showing org identity, notifications popover, theme toggle, and user menu.
  It sits above the routed content inside the same bordered/rounded shell
  frame as the sidebar (`lg:rounded-[10px] border`), not as a separate global
  bar — check the client's HTML for the exact chrome pattern before assuming
  this one.

Layout skeleton per protected portal (`(admin)/layout.tsx`, `(tenant)/layout.tsx`):

```tsx
<ThemeProvider>
  <SidebarCollapseProvider>
    <div className="flex h-dvh overflow-hidden">
      <PortalSidebar />
      <div className="flex h-dvh flex-1 flex-col">
        <div className="flex flex-1 flex-col overflow-hidden lg:rounded-[10px] border">
          <AuthGate realm="...">
            <Navbar portal="..." />
            <main className="flex-1 overflow-auto">{children}</main>
          </AuthGate>
        </div>
      </div>
    </div>
  </SidebarCollapseProvider>
</ThemeProvider>
```

(Note: `AuthGate` wraps `Navbar` too here, per §3's flicker fix — this
deviates from the reference project's current code, which gates only
`{children}`; do it right from the start in the new project.)

---

## 5. Theme (dark mode) structure

- A `ThemeProvider` context (`components/shared/ThemeProvider.tsx`) tracks
  `theme: "light" | "dark"`, persisted to `localStorage`, defaulting to the
  OS preference (`prefers-color-scheme`) on first visit.
- It toggles a `.dark` class on `document.body` — **body, not a nested div**,
  because portaled overlays (dialogs, dropdowns, popovers via Radix/Base UI)
  attach directly to `document.body` and would sit outside a nested
  wrapper's scope.
- Mount `ThemeProvider` only inside `(admin)`/`(tenant)` layouts, not root —
  it removes the `.dark` class on unmount, so navigating back to the public
  site always renders light regardless of the stored preference. Confirm
  with the client whether the public marketing site should support dark
  mode at all; if not, this scoping is correct as-is.
- Read the initial preference in a `useEffect`, not during render, to avoid
  SSR/CSR markup mismatches (localStorage/matchMedia don't exist on the
  server).
- Tailwind: use the `dark:` variant throughout; define color tokens (not raw
  hex) so light/dark pairs stay centralized — check the client's design file
  for whether they've specified a token palette already.
- Per the working guidelines (§8), every new UI component ships with both
  responsive breakpoints and dark mode variants in the same change — never
  as follow-up work.

---

## 6. API integration architecture

### Layered client (`src/lib/api/`)

```
lib/api/
├── http.ts       # Single Axios instance — baseURL "/api/v1", withCredentials: true
├── csrf.ts       # Double-submit CSRF cookie read + bootstrap + refresh
├── envelope.ts   # apiGet / apiGetPage / apiSend / apiUpload — unwraps { success, data, meta } | { success:false, error }
├── errors.ts     # ApiError class + ErrorCode enum
└── session.ts    # notifyUnauthorized() — pub/sub the 401 interceptor calls into
```

- **One Axios instance for the whole app.** Nothing outside `lib/api/` and
  `**/api/*.service.ts` imports it directly — pages/components only ever
  call feature `*.service.ts` functions, which call `envelope.ts` helpers.
  Enforce with an ESLint `no-restricted-imports` rule if the team tends to
  reach for `axios`/`fetch` directly out of habit.
- **Same-origin API base.** The browser always talks to `/api/v1` on its own
  origin; `next.config.ts` rewrites `/api/:path*` to the real backend
  (`BACKEND_URL`, server-only env var). This keeps the session cookie
  first-party — critical, since third-party cookies get blocked by browsers.
- **Response envelope.** Every API response is `{ success: true, data, meta? }`
  or `{ success: false, error: { code, message, details?, requestId? } }`.
  `envelope.ts` is the only place that unwraps it — everything downstream
  gets plain `data` or a thrown `ApiError`, never a `success` flag to check
  manually.
- **CSRF (double-submit cookie).** See the earlier conversation turn for the
  full mechanism; summary: a JS-readable `csrf` cookie is echoed back as an
  `x-csrf-token` header on every mutating request (POST/PUT/PATCH/DELETE),
  bootstrapped lazily via `GET /auth/csrf` on first mutation, refreshed
  transparently on a `CSRF_INVALID` response with a single retry.
- **Dev-only tenant header.** On localhost (no wildcard subdomains available),
  an `x-tenant-subdomain` header lets the backend resolve tenant realm from a
  header instead of the host — gated to non-production and absent under
  `/admin` paths.

### Feature services

Each feature owns a typed service module, not raw fetch calls in components:

```ts
// (tenant)/modules/staff/api/staff.service.ts
export const staffService = {
  list: (params?: OpQuery<"/staff", "get">) => apiGetPage<Staff>("/staff", params),
  create: (body: OpBody<"/staff", "post">) => apiSend<Staff>("post", "/staff", body),
  ...
};
```

- Request/response types come from a **generated OpenAPI spec**
  (`openapi-typescript`), via `OpBody<Path, Method>` / `OpData<Path, Method>`
  / `OpQuery` / `OpParams` helpers over `paths` from `src/types/api.d.ts`.
  Add an `api:types` script (`openapi-typescript openapi.json -o src/types/api.d.ts`)
  and an `api:types:check` script for CI drift detection, if the backend
  publishes an OpenAPI spec. If it doesn't yet, start with hand-written
  request/response types per service and swap to generated types once the
  spec exists — don't block on it.
- Endpoints not covered by the generated types (or needing runtime
  validation of untyped fields) get a local Zod schema in the service file
  — parse at the boundary, trust the parsed shape everywhere after.

### React Query scope

- `ReactQueryProvider` wraps `(admin)`/`(tenant)` layouts, **not the root
  layout** — the public marketing site and auth pages (login/signup/forgot
  password) don't need a shared query cache; keep them on plain
  `fetch`/local `useState`, or Server Component data fetching (see §7). This
  keeps the public bundle smaller and avoids the public site depending on a
  client-only cache provider it doesn't need.
- `useMe()` — the identity query — is the one query every protected page can
  assume is already warm, since `AuthGate` triggers it on mount of the
  authenticated shell.
- Mutations that must be reflected immediately elsewhere in the UI
  (`useLogin` seeding `['me']`, etc.) should only rely on `queryClient`
  tricks within the _same_ provider tree — a redirect across provider trees
  (e.g. public login page → admin dashboard) starts a fresh `QueryClient`
  instance, so any pre-seeded cache from the old tree is lost. Plan for one
  extra fetch after such a transition rather than fighting it.

---

## 7. Public site: SSR & SEO

Marketing pages (home, features, about, contact, pricing) should default to
plain **Server Components with no client data-fetching** — this is free SSR
and indexability, no special setup needed.

If a public page needs dynamic data from the backend (e.g. a pricing page
listing live plans):

- Fetch it **server-side**, directly against `BACKEND_URL` (not the `/api/*`
  browser rewrite — Server Components run on the Node server itself, so a
  relative fetch has no origin to resolve against).
- Use Next's data cache with a sensible revalidation window:
  `fetch(url, { next: { revalidate: 300 } })` for content that changes
  occasionally, not per-request.
- Pass the fetched data down as props into the client components that render
  it; keep those components `"use client"` only for genuine interactivity
  (toggles, forms), not for the fetch itself.
- No CSRF/cookie handling needed for these — they're unauthenticated public
  GETs.

Auth pages (login, signup, forgot/reset password) are fine as full Client
Components with their own client-side fetch/mutation logic — they're action
forms, not indexable content, so SSR doesn't buy anything there.

---

## 8. Working guidelines (carry over from the reference project)

1. **Every UI change ships responsive (down to 360px) and with dark mode in
   the same diff** — not as separate follow-up work.
2. **New UI ships with baseline motion** — hover/transition states,
   enter/exit transitions for dropdowns/mobile menus. Subtle, not decorative.
3. **Admin/tenant desktop layout (`lg:` and up) must match the client's
   design file exactly** and is never altered to accommodate smaller
   screens; responsiveness below `lg:` is your reasonable call (collapsible
   sidebar, stacked cards instead of tables, etc.) if the design file is
   desktop-only.
4. **Stay in scope per task** — prefer adding a prop/variant to a shared
   component over editing its default behavior for every caller.
5. Verify UI changes with `tsc`/lint, not manual screenshotting, unless
   explicitly asked to visually verify.

---

## 9. Suggested dependency baseline

Matches the reference project; swap only where the client's design system
differs (e.g. a different component primitive library):

```
next, react, react-dom
@tanstack/react-query (+ devtools)
axios
zod
react-hook-form + @hookform/resolvers
@base-ui/react (or your chosen headless primitives — shadcn-style)
class-variance-authority, clsx, tailwind-merge
lucide-react (icons)
tailwindcss v4 + @tailwindcss/postcss
openapi-typescript (dev, if backend publishes a spec)
socket.io-client (only if the product needs realtime)
recharts (only if the product needs charts/reports)
```

---

## How to use this with the client's files

1. Read the client's HTML/design files for **visual** truth — colors,
   spacing, component look, breakpoints they've actually specified.
2. Read the requirement doc for **feature scope** — which route-group pages
   exist, what each portal's sidebar nav items are, what permissions/roles
   the product needs.
3. Use this document for **structure and wiring** — where files go, how auth
   and theming and API calls are plumbed, so features get build on a
   consistent skeleton instead of ad hoc per-page.
