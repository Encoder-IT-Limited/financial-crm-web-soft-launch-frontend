# Documentation Index

`docs/` is organized by what a document *is*, not by feature area — so "where does this
belong" always has one answer. Six folders, plus a small set of files that stay at the
root by necessity (see below).

| Folder | What lives here | Edited by us? |
| :--- | :--- | :--- |
| [`source/`](#source) | Raw client-provided material — proposal, SRS, prototype, Q&A | **No** — never edited, only referenced |
| [`architecture/`](#architecture) | Cross-cutting technical foundation (folder structure, design tokens, auth model) | Rarely — foundational, changes only with real architecture decisions |
| [`requirements/`](#requirements) | What the client actually needs, synthesized from `source/` | Occasionally — as new client answers arrive |
| [`plans/`](#plans) | Per-realm implementation plans **and** progress trackers — the living record of what's built | **Yes, constantly** — updated in the same change as any file it describes |
| [`qa/`](#qa) | Bug reports, per-module "what's still broken/missing" checklists, and unused-but-available API notes | **Yes, constantly** — re-verified against current code and (where credentials exist) live-tested, not just read from memory |
| [`backend/`](#backend) | Instructions for building the real API behind today's mock services | As the mock layer evolves |

**Rule of thumb**: if you're citing a document as "why we're doing X," it's in `source/`
or `requirements/`. If you're describing "how X is/will be built," it's in `plans/` or
`backend/`. If you're recording "X is broken/missing/unused right now," it's in `qa/`.
`architecture/` is the only place that isn't about a specific feature.

## Files that stay at `docs/` root — not a filing mistake

`Project-Structure.md`, `Basic-Setup.md`, `Client-proposal.md`,
`MRM_Project_Proposal_v2.pdf`, and `mrm-portal-v3 (1).html` are referenced by their exact
current `docs/`-root path in `AGENTS.md` (the always-loaded project instructions). Moving
or renaming them would silently break those references, and `AGENTS.md` isn't edited as
a side effect of a docs reorganization — that's a separate, deliberate decision. Per the
categories above, `Project-Structure.md`/`Basic-Setup.md` conceptually belong in
`architecture/` and the other three in `source/`; treat their root location as a known,
intentional exception rather than something to "fix" later without also updating
`AGENTS.md` in the same change.

---

## `source/`

Never edit these — they're the client's own words or contract documents. If something
here turns out to be wrong or outdated, that's a conversation with the client, not an
edit to the file.

- **[inv-pos-hr-tenant-SRS.md](source/inv-pos-hr-tenant-SRS.md)** — the detailed Software
  Requirements Specification the proposal was built from: functional requirements,
  end-to-end workflows, and database design, section-numbered (§11–§33).
- **`Client-proposal.md`, `MRM_Project_Proposal_v2.pdf`, `mrm-portal-v3 (1).html`** — see
  the root-exception note above; conceptually part of this folder, physically at
  `docs/` root.

**Known gap**: `Client-Requirements-Phase1.md` (see `requirements/` below) cites two
source files — `docs/Questions for MRM.md` and `docs/Copy of question for MRM.md` — that
don't exist anywhere in the repo. Either they were never checked in, or the client's
answers only ever existed synthesized into `requirements/Client-Requirements-Phase1.md`
directly. Flag to whoever holds the original client correspondence rather than assuming.

## `architecture/`

Foundational technical decisions that every module builds on top of — not tied to one
feature, so they don't live in `plans/`.

- **[Frontend-Architecture.md](architecture/Frontend-Architecture.md)** — Next.js App
  Router conventions: route groups, the per-realm module layout
  (`api/`/`hooks/`/`components/`), shared-code locations.
- **`Basic-Setup.md`, `Project-Structure.md`** — see the root-exception note above;
  conceptually part of this folder, physically at `docs/` root. `Basic-Setup.md` covers
  route groups, the five-layer auth model, sidebar/navbar wiring, theming, and the API
  client layer — read before scaffolding anything. `Project-Structure.md` covers the
  derived design system (colors, typography, spacing, component specs) plus the full
  folder structure and phased build plan — read before any structural or visual work.

## `requirements/`

What the client needs, synthesized from everything in `source/` with each requirement
traceable back to its origin.

- **[Client-Requirements-Phase1.md](requirements/Client-Requirements-Phase1.md)** —
  every Phase 1 requirement (Super Admin, Multi-Tenant, Inventory & Procurement, POS,
  Sales & Invoicing), each tagged `[Client decision]`, `[Proposal]`, or `[SRS]` so you
  can trace it back to `source/`. Also lists every genuinely open question.

## `plans/`

The living record — one file per realm, each doubling as an implementation plan *and* a
progress tracker. **These get updated in the same change as any file they describe** —
that discipline is what keeps them trustworthy instead of stale.

- **[Public-SuperAdmin-Plan.md](plans/Public-SuperAdmin-Plan.md)** — the `(public)`
  marketing site and `(admin)` Super Admin portal: pricing, signup, tenant management,
  plans, payments, audit log, settings.
- **[Sales-Invoicing-Implementation-Plan.md](plans/Sales-Invoicing-Implementation-Plan.md)**
  — the tenant portal's Sales & Invoicing suite: Invoices, Proposals, Credit/Debit Notes,
  Retainers, Recurring, Reports, and Delivery/Fulfillment.
- **[POS-Implementation-Plan.md](plans/POS-Implementation-Plan.md)** — a web-based POS
  register (demo/R&D pass): sessions, sale/checkout, refunds, registers admin. Offline
  mode, real hardware, and native apps are explicitly out of scope for this pass.

**Known gap**: an `Inventory-Implementation-Plan.md` covering Products, Warehouses,
Stock Movement/Transfer, Goods Receipt, Adjustments, Batches, Reorder, and Valuation was
never written — the Inventory module's actual state is tracked only in
`qa/open-issues.md`, not in a dedicated plan doc. Worth writing one if Inventory keeps
evolving; not fabricated here since it'd need real authorship, not a file move.

## `qa/`

What's actually broken, missing, or sitting unused right now — re-verified against
current code (and live-tested against the real backend where demo credentials exist),
not written from memory. Update these in place: remove what's since been fixed, add
what's newly found. Don't let them go stale — a checklist nobody re-checks is worse than
no checklist.

- **[bugs-report.md](qa/bugs-report.md)** — tenant portal and app-wide (cross-portal)
  issues.
- **[open-issues.md](qa/open-issues.md)** — consolidated open issues across every
  module (POS, Reports, Admin Portal, Public Site — Sales & Invoicing and Inventory
  currently have none). Replaces the old one-file-per-module
  `missing-sales-invoice.md`/`missing-reports.md`/`missing-inventory.md`/`missing-pos.md`/
  `missing-admin-public.md` docs, merged here once each had shrunk to a handful of items.

## `backend/`

- **[Backend-Build-Guide.md](backend/Backend-Build-Guide.md)** — everything a backend
  team needs to build the real API behind the mock services described in `plans/`: entity
  shapes (pulled from the actual TypeScript types), endpoint contracts per mock-service
  method, business rules that today only exist in client-side validation, and the open
  questions that need answers before certain endpoints can be finalized.

---

## Files intentionally not in `docs/`

`AGENTS.md` / `CLAUDE.md` (repo root) — project-wide working instructions for AI
assistants, always-loaded context. Not documentation about the product; documentation
about how to work in this repo.
