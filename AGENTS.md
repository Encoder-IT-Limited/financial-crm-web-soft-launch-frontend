<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MRM Portal — Project Summary & Instructions

## What this is

A multi-tenant SaaS accounting/ERP platform with two authenticated portals behind one
public marketing site:

- **Super Admin portal** (MRM, the platform operator) — manages tenants, subscription
  plans/pricing, payments, and a platform audit log.
- **Client Admin portal** (a tenant's own team) — full accounting/ERP suite: general
  ledger, invoicing/sales, purchasing/expenses, inventory, banking, CRM, tax/compliance
  reports, alerts, AI assistant.

There is no Figma/design-file handoff for this project — `docs/mrm-portal-v3 (1).html`
(a static prototype) is the only visual reference, and `docs/Project-Structure.md` is
the derived design system + folder structure + phased build plan. Read
**`docs/Project-Structure.md` first** for anything structural or visual; it supersedes
guessing from the HTML file directly. `docs/Basic-Setup.md` is the underlying
architecture guide (route groups, auth layering, theming, API client) both documents
build on — read it before scaffolding anything.

`docs/Client-proposal.md` and `docs/MRM_Project_Proposal_v2.pdf` are the feature-scope
source of truth; the HTML prototype covers Phase 1 (accounting core) only — POS, full
HR/Payroll, Calendar/Booking, Social Media, and the mobile app are later phases (see
`Project-Structure.md` §5), not MVP.

## Instructions

1. Follow `docs/Basic-Setup.md` exactly for folder structure, route groups
   (`(public)`, `(admin)`, `(tenant)`), the five-layer auth model, sidebar/navbar
   wiring, theming, and the API client layer. Don't improvise structure that
   contradicts it.
2. Use `docs/Project-Structure.md` §2 for all colors, typography, spacing, radii, and
   component specs — don't invent new tokens or pull colors ad hoc from the HTML file;
   the doc already extracted and organized them (light + a proposed dark palette).
3. Build in the phase order in `docs/Project-Structure.md` §5 — Phase 1 (accounting
   core matching the prototype) before Phase 2 (inventory) before Phase 3
   (HR/Payroll/Calendar/Social/POS/mobile).
4. **Every UI change ships responsive (down to 360px) and with dark mode in the same
   diff.** Desktop (`lg:` and up) must match the prototype exactly where a page exists
   in it; responsiveness below `lg:` is your call per `Basic-Setup.md` §8 and
   `Project-Structure.md` §6 (stacked cards instead of dense tables, off-canvas
   sidebar, etc.).
5. The dark-mode palette in `Project-Structure.md` §2.1 is a proposal, not
   client-approved — flag this if the client pushes back on dark-mode colors later.
6. Open questions in `Project-Structure.md` §7 (sub-roles/RBAC, QR codes on invoices,
   two vs. three realms, Windows POS) are unresolved — don't silently assume an answer
   in a way that's hard to unwind; ask or flag instead.
7. Verify UI changes with `tsc`/lint only — do not start the dev server or visually
   check pages in a browser as part of routine work. Compare against the prototype
   markup/CSS by reading it, not by rendering it.
8. **Component file names are kebab-case** (`public-navbar.tsx`, `admin-sidebar.tsx`),
   matching shadcn's own generated files (`button.tsx`, `card.tsx`) — never PascalCase
   filenames. The exported component/function name inside stays PascalCase as usual
   (`export function PublicNavbar() { ... }`); only the file on disk is kebab-case.
9. **Do not run `git commit` automatically.** Stage changes as needed, then hand the user
   a proposed commit message to review — they run the commit themselves.
10. **Do not use `react-hook-form` in new code**, despite it being in `Basic-Setup.md`
    §9's suggested baseline and already used in `login/page.tsx`. Build new forms with
    plain `useState` + `zod`'s `.safeParse()` for validation instead. The package stays
    installed and `login/page.tsx` is left as-is for now — this only governs forms
    written from here on (signup, plan editor, etc.). Note: shadcn's `form` primitive
    isn't installable anyway under our Base UI flavor (`-b base`) — that wrapper only
    ships for the Radix flavor, so this isn't a loss of tooling either way.
11. **`@tanstack/react-table` is pinned to `^8`, not the latest `9.x`.** v9 shipped a
    completely different feature-based API (no more `getCoreRowModel`/`useReactTable`
    as we use them) that `filterable-table.tsx`/`simple-table.tsx` are not written
    against. Don't let a bare `npm install @tanstack/react-table` silently bump this to
    v9 — it will break both table components.
12. **shadcn's sidebar primitive (`components/ui/sidebar.tsx`) uses `lg:` (1024px), not
    its default `md:` (768px)**, to match `Basic-Setup.md` §4's desktop breakpoint —
    every `md:` in that file (and in `hooks/use-mobile.ts`'s `MOBILE_BREAKPOINT`) was
    deliberately changed to `lg:`/`1024`. If `npx shadcn add sidebar --overwrite` is
    ever run again, redo that swap — the registry version still ships `md:`.
13. **`page.tsx` and `layout.tsx` files are never `"use client"`.** Marking an entire
    page/layout client-side pulls its whole subtree — including static headings and
    layout markup that never needed to hydrate — into the client bundle, and was the
    actual cause of a route-change flicker on the public site (fixed 2026-08-19). When a
    page needs interactivity (a form, local state, `useSearchParams`), extract just that
    part into its own small named component (e.g. `login-form.tsx`, `signup-flow.tsx`)
    and mark only that file `"use client"`; the page composes it alongside static
    content. This applies everywhere, not just `(public)`.
14. **Stay strictly inside the requested scope.** Before editing a file, confirm it's
    actually part of what was asked — don't touch adjacent routes, modules, or files
    "while you're in there," even if they share a pattern with what's being changed
    (e.g. a task scoped to the admin portal must not touch the tenant portal, and vice
    versa). If a broader change genuinely seems necessary, ask first instead of doing
    it silently.
