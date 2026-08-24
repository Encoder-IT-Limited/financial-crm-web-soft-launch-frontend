# Documentation Index

`docs/` is organized by what a document *is*, not by feature area — so "where does this
belong" always has one answer. Five folders:

| Folder | What lives here | Edited by us? |
| :--- | :--- | :--- |
| [`source/`](#source) | Raw client-provided material — proposal, SRS, prototype, Q&A | **No** — never edited, only referenced |
| [`architecture/`](#architecture) | Cross-cutting technical foundation (folder structure, design tokens, auth model) | Rarely — foundational, changes only with real architecture decisions |
| [`requirements/`](#requirements) | What the client actually needs, synthesized from `source/` | Occasionally — as new client answers arrive |
| [`plans/`](#plans) | Per-realm implementation plans **and** progress trackers — the living record of what's built | **Yes, constantly** — updated in the same change as any file it describes |
| [`backend/`](#backend) | Instructions for building the real API behind today's mock services | As the mock layer evolves |

**Rule of thumb**: if you're citing a document as "why we're doing X," it's in `source/`
or `requirements/`. If you're describing "how X is/will be built," it's in `plans/` or
`backend/`. `architecture/` is the only place that isn't about a specific feature.

---

## `source/`

Never edit these — they're the client's own words or contract documents. If something
here turns out to be wrong or outdated, that's a conversation with the client, not an
edit to the file.

- **[Client-proposal.md](source/Client-proposal.md)** — a cross-reference note comparing
  an earlier prototype against the signed proposal; fills gaps only, lowest priority
  source.
- **[MRM_Project_Proposal_v2.pdf](source/MRM_Project_Proposal_v2.pdf)** — the signed
  scope document: modules, hour estimates, 14-week delivery plan, recommended tech stack.
- **[inv-pos-hr-tenant-SRS.md](source/inv-pos-hr-tenant-SRS.md)** — the detailed Software
  Requirements Specification the proposal was built from: functional requirements,
  end-to-end workflows, and database design, section-numbered (§11–§33).
- **[mrm-portal-v3-prototype.html](source/mrm-portal-v3-prototype.html)** — the only
  visual/design reference for this project (no Figma handoff exists).
- **[client-qa-retainers.md](source/client-qa-retainers.md)** — the client's answers to
  the retainer-flow question round (funding, drawing, recurring, expiry, refunds).
- **[client-qa-inventory-pos-tenant.md](source/client-qa-inventory-pos-tenant.md)** — the
  client's answers to 33 questions spanning multi-tenancy, inventory/procurement, POS,
  and sales/invoicing.

## `architecture/`

Foundational technical decisions that every module builds on top of — not tied to one
feature, so they don't live in `plans/`.

- **[Basic-Setup.md](architecture/Basic-Setup.md)** — route groups (`(public)`/`(admin)`/
  `(tenant)`), the five-layer auth model, sidebar/navbar wiring, theming, the API client
  layer. Read before scaffolding anything.
- **[Project-Structure.md](architecture/Project-Structure.md)** — the derived design
  system (colors, typography, spacing, component specs) plus the full folder structure
  and phased build plan. Read before any structural or visual work.

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
  plans, payments, audit log, settings. Has a "Status check" section flagging where the
  actual code has drifted from the original plan.
- **[Sales-Invoicing-Implementation-Plan.md](plans/Sales-Invoicing-Implementation-Plan.md)**
  — the tenant portal's Sales & Invoicing suite: Invoices, Proposals, Credit/Debit Notes,
  Retainers, Recurring, Reports, and Delivery/Fulfillment. Phases A–H done; includes the
  full retainer Key-Decisions log resolving the client's open Q&A items. Phase I
  (Delivery/Fulfillment — the join point with Inventory) is mostly built, against the
  same isolated demo catalog as the Product Picker; the delivery-note PDF view and the
  real Inventory swap are still open.
- **[Inventory-Implementation-Plan.md](plans/Inventory-Implementation-Plan.md)** — the
  tenant portal's Inventory suite: Products, Warehouses, Stock Movement/Transfer, Goods
  Receipt, Adjustments, Batches, Reorder, Valuation. UI-complete against mock data; the
  real API layer is Phase B.

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
