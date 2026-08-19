# MRM Portal — Project Structure & Build Plan

This document turns `Basic-Setup.md` (architecture skeleton), `Client-proposal.md` +
`MRM_Project_Proposal_v2.pdf` (feature scope), and `mrm-portal-v3 (1).html` (visual
reference/prototype) into one concrete plan: design system, folder structure, and a
step-by-step build order. Nothing here is final — it's the draft for client approval.

---

## 1. What this product is

MRM Portal is a **multi-tenant SaaS accounting/ERP platform** with two authenticated
portals sitting behind one public marketing site:

- **Super Admin portal** (MRM, the platform operator) — manages all client (tenant)
  accounts, subscription plans & pricing, payments, and a platform-wide audit log.
- **Client Admin portal** (a tenant's own team) — the full operational suite: general
  ledger accounting, invoicing/sales, purchasing/expenses, inventory, banking, CRM
  (customers/vendors/leads), tax/compliance reports, alerts, and an AI assistant.

The HTML prototype (`mrm-portal-v3 (1).html`) is a single-file mock of this exact
two-role product — it's the source of visual truth (colors, spacing, component look)
and a close approximation of scope for the accounting core. The proposal PDF describes
a larger long-term feature set (POS, full HR/Payroll, Calendar/Booking, Social Media
integration, mobile companion app) that the prototype doesn't cover yet — treated here
as later phases, not MVP.

**Two realms only** (not three) — this product has no separate self-serve marketing
funnel with its own feature pages beyond login/pricing; "public" is thin (landing +
login + pricing) compared to the reference architecture in `Basic-Setup.md`. Follow
`Basic-Setup.md`'s route-group and layering rules throughout; this doc fills in the
product-specific content.

---

## 2. Design system

Extracted from the prototype's `:root` tokens and component CSS. Values below are the
**light** palette as shipped in the mock; dark-mode values are proposed (the mock
itself is light-only) and need client sign-off.

### 2.1 Color tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--navy` | `#0a1628` | `#0a1628` | Sidebar background, super-admin chrome |
| `--navy-2` | `#0f1f3d` | `#0f1f3d` | Sidebar gradient end, bank card gradient |
| `--surface` | `#ffffff` | `#111827` | Card/panel background |
| `--surface-muted` | `#f4f5f7` | `#0b0f19` | App body background |
| `--surface-subtle` | `#f8fafc` / `#f1f5f9` | `#1a2333` | Track bars, kanban columns, table stripe |
| `--border` | `#e8eaf0` | `#232c3d` | Card/input borders |
| `--text` | `#0f172a` | `#f1f5f9` | Primary text |
| `--text-2` | `#374151` | `#cbd5e1` | Secondary text |
| `--text-3` | `#64748b` | `#94a3b8` | Tertiary text, nav labels |
| `--text-4` | `#94a3b8` | `#64748b` | Placeholder, hint text |
| `--blue` | `#1d4ed8` | `#3b82f6` | Primary brand/action color |
| `--blue-l` (tint) | `#eff6ff` | `#0f1f3d`/20% blue | Info banners, active nav bg |
| `--green` | `#16a34a` | `#22c55e` | Income, success, paid states |
| `--red` | `#dc2626` | `#ef4444` | Expense, overdue, destructive |
| `--amber` | `#d97706` | `#f59e0b` | Warnings, pending, expiring |
| `--purple` | `#7c3aed` | `#a78bfa` | Super Admin accent (role badge, nav section) |
| `--slate` | `#64748b` | `#94a3b8` | Neutral icons/buttons |

Each semantic color (`blue`/`green`/`red`/`amber`/`purple`) also needs a `-l` (light
tint, ~10% background wash) and `-t` (tint border, ~stronger wash) pair per theme —
the mock defines these for light; dark equivalents should keep the same hue at lower
saturation/lightness on a dark surface (e.g. `--green-l-dark: rgba(34,197,94,.12)`)
rather than inverting to a pale color.

**Dark mode implementation note:** per `Basic-Setup.md` §5, tokens must be CSS
variables toggled via a `.dark` class on `document.body`, not raw Tailwind `dark:` hex
literals scattered through components — centralize the pairs above in `globals.css`.

### 2.2 Typography

- Font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  (system font stack — no webfont dependency, matches the mock exactly).
- Base size: `13px` body / controls. Scale used in the mock:
  - Page title: `20–22px / 800`
  - Section/card heading: `14–15px / 700`
  - Body/table: `12.5–13px / 400–500`
  - Label/meta/badge: `10.5–11px / 600–700`
- Numbers in financial contexts (amounts, totals) are bold and often color-coded
  (green = positive/income, red = negative/overdue).

### 2.3 Spacing & radii

- Card padding: `16–20px`. Modal padding follows card conventions, width `660px` max.
- Radii: `6px` (small controls/icons) · `8–10px` (buttons, inputs, alerts) ·
  `12–14px` (cards, metrics, kanban) · `16–20px` (modals, login card) · full/`50%`
  (avatars, dots, toggles).
- Borders: `1px solid var(--border)` on virtually every card/table/input; `2px` on
  interactive selectable cards (plan picker).

### 2.4 Core components (build as `src/components/ui/`)

Sourced via the shadcn CLI (`npx shadcn add <component>`), Base UI flavor
(`components.json` → `-b base`, matching `Basic-Setup.md` §9's "`@base-ui/react` —
shadcn-style" baseline) — not hand-rolled per component. shadcn's generic token names
(`--primary`, `--border`, `--muted`, `--sidebar`, ...) are aliased in `globals.css` to
the brand tokens in §2.1, so every generated component matches the client's palette
automatically instead of shadcn's default neutral theme; only add net-new
one-off styling on top when a component needs to deviate from the mock. Derived from
the mock's class list:

- `Button` — variants: primary (`--blue` fill), secondary (light gray), destructive
  (`--red`), ghost/icon (`btn-icon`, 30×30 square). Sizes: default, `xs`.
- `Card` — white/surface panel, `12px` radius, `1px` border.
- `Metric` / `StatCard` — icon chip + big number + label, used on dashboards.
- `Badge` — pill, semantic color variants (paid/pending/overdue/draft etc.), `20px`
  radius.
- `Modal` / `Dialog` — centered, `16px` radius, header with `modal-close` icon button.
- `Tabs` — pill-style segmented control (`background:#f1f5f9`, active tab gets white
  chip).
- `ProgressBar` (`bar-track`/`bar-fill`) — used for budget %, compliance progress,
  category spend.
- `Donut` / chart primitives — for expense-by-category, income vs expense.
- `Toggle` (switch) — for settings booleans (payment gateways, auto-disable).
- `Table` — dense financial tables with right-aligned numeric columns and a progress
  cell pattern (see budget table in mock).
- `Toast` — bottom-right, dark pill, auto-dismiss.
- `Alert`/`InfoBanner` — colored-tint banner with icon + text + optional inline action
  link (used heavily for compliance/VAT/AI hints).
- `KanbanColumn`/`KanbanCard` — used for the Leads Pipeline.
- `EmptyState`/dashed drop zone (`+ Add account` pattern).

All of the above ship with **both** a `lg:` desktop spec matching the mock exactly and
a responsive/mobile treatment (stacked cards instead of dense tables below `lg:`, per
`Basic-Setup.md` §8 rule 3) and dark-mode variants, in the same change.

### 2.5 Motion

Mock uses `transition: all .13s` on hovers/active states almost universally, plus a
`.2s` toggle slide and `.3s` opacity fade for the toast, and a `.4s` width transition
on progress bars. Keep new components in that ~130ms hover / ~300ms enter-exit range —
subtle, not decorative, per `Basic-Setup.md` §8 rule 2.

---

## 3. Information architecture

### 3.1 Realms & hosts

| Host | Realm | Serves |
|---|---|---|
| `www.<domain>` / `localhost/` | Public | Landing, pricing, login |
| `admin.<domain>` / `localhost/admin` | Super Admin | Tenant/plan/payment/audit management |
| `<tenant>.<domain>` / `localhost/dashboard` | Client (tenant) | Full accounting/ERP suite |

Login is a single page with a **role tab** (Super Admin / Client), matching the mock's
`login-tabs` — not two separate login routes. Post-login redirect target is decided by
the `/me` response's realm, not the tab chosen.

### 3.2 Client (tenant) portal — sidebar nav

Grouped exactly as the mock's sidebar sections, each item a route under
`(tenant)/dashboard/`:

**Accounting**
Dashboard · Chart of Accounts · Journal Entry · General Ledger · Trial Balance ·
Balance Sheet

**Sales**
Invoices · Proposals · Retainers · Credit & Debit Notes

**Purchases**
Bills · Expenses · Budget

**Inventory** *(Phase 2 — see §5)*
Products & SKU · Stock Movement

**Banking**
Bank Accounts · Transactions

**CRM**
Customers · Vendors · Inquiries · Leads Pipeline

**Reports & Compliance**
All Reports · VAT Report · Corporate Tax · Scheduled Reports

**System**
Alerts · AI Assistant · Settings

(The mock's "Data Model" / ER-diagram nav item is a dev/demo artifact for this
prototype, not a real product page — drop it from the build.)

### 3.3 Super Admin portal — sidebar nav

Single section under `(admin)/admin/`:

All Clients (tenants) · Plans & Pricing · Payments · Audit Log

Plus platform-wide settings (branding/white-label, notification templates, payment
gateway toggles) — seen in the mock's settings page and shared conceptually with the
tenant Settings page but scoped to platform defaults.

### 3.4 Roles & permissions (from the mock's permission matrix + proposal)

- **Super Admin (MRM)** — full access to everything, across all tenants.
- **Client Admin** — full access within their own tenant; can manage their own team's
  seats/roles ("Own team" in the matrix).
- Sub-roles within a tenant (accountant, staff, approver) are implied by the
  Expense Approval Workflow and "seat management" in the proposal but not enumerated
  in the mock — **needs client clarification** before building granular RBAC beyond
  Super Admin / Client Admin.

---

## 4. Full folder structure

Following `Basic-Setup.md` §1 exactly, populated with this product's actual routes.
Two protected route groups instead of three (no separate marketing-feature route
group beyond what's listed under `(public)`):

```
src/app/
├── layout.tsx
├── globals.css                      # design tokens from §2, light + dark
│
├── (public)/
│   ├── layout.tsx
│   ├── error.tsx / loading.tsx / not-found.tsx
│   ├── page.tsx                     # / — landing
│   ├── pricing/page.tsx             # plan cards (plan-card pattern from mock)
│   ├── login/page.tsx               # role-tabbed login (Super Admin / Client)
│   ├── components/                  # landing sections, plan-card, etc.
│   └── modules/
│
├── (admin)/                         # Super Admin portal — admin.<domain>
│   ├── layout.tsx                   # ThemeProvider + SidebarCollapseProvider + AuthGate shell
│   ├── error.tsx / loading.tsx / not-found.tsx
│   ├── components/
│   ├── modules/
│   │   ├── tenants/
│   │   ├── plans/
│   │   ├── payments/
│   │   └── audit/
│   ├── types/
│   └── admin/
│       ├── page.tsx                 # /admin — platform overview
│       ├── tenants/page.tsx         # "All Clients"
│       ├── plans/page.tsx           # "Plans & Pricing"
│       ├── payments/page.tsx
│       ├── audit/page.tsx
│       └── settings/page.tsx        # branding, gateways, notification templates
│
└── (tenant)/                        # Client Admin portal — <tenant>.<domain>
    ├── layout.tsx
    ├── error.tsx / loading.tsx / not-found.tsx
    ├── components/
    ├── modules/
    │   ├── accounting/               # chart-of-accounts, journal, ledger, trial-balance, balance-sheet
    │   ├── sales/                    # invoices, proposals, retainers, credit-debit-notes
    │   ├── purchasing/               # bills, expenses, budget
    │   ├── inventory/                # products, stock-movement (Phase 2)
    │   ├── banking/                  # accounts, transactions
    │   ├── crm/                      # customers, vendors, inquiries, leads
    │   ├── reports/                  # all-reports, vat, corp-tax, scheduled-reports
    │   ├── alerts/
    │   ├── ai-assistant/
    │   └── settings/
    ├── types/
    └── dashboard/
        ├── page.tsx                  # /dashboard — tenant overview
        ├── chart-accounts/page.tsx
        ├── journal/page.tsx
        ├── ledger/page.tsx
        ├── trial-balance/page.tsx
        ├── balance-sheet/page.tsx
        ├── invoices/page.tsx
        ├── invoices/[invoiceId]/page.tsx
        ├── proposals/page.tsx
        ├── retainers/page.tsx
        ├── credit-notes/page.tsx     # credit & debit notes, tabbed
        ├── bills/page.tsx
        ├── expenses/page.tsx
        ├── budget/page.tsx
        ├── products/page.tsx         # Phase 2
        ├── inv-movement/page.tsx     # Phase 2
        ├── banking/page.tsx
        ├── transactions/page.tsx
        ├── customers/page.tsx
        ├── customers/[customerId]/page.tsx
        ├── vendors/page.tsx
        ├── inquiries/page.tsx
        ├── leads/page.tsx
        ├── reports/page.tsx
        ├── reports/vat/page.tsx
        ├── reports/corp-tax/page.tsx
        ├── reports/scheduled/page.tsx
        ├── alerts/page.tsx
        ├── ai/page.tsx
        └── settings/page.tsx
```

Shared code (`src/components`, `src/lib`, `src/hooks`, `src/providers`, `src/types`)
follows `Basic-Setup.md` §1 verbatim — no changes needed there.

---

## 5. Phasing (build order)

Scope in the client proposal is broader than the HTML prototype. Build in phases so
the prototype's exact scope ships first as a coherent MVP, then layer on the rest.

**Phase 0 — Foundation**
Repo scaffolding per `Basic-Setup.md` (route groups, auth layers, API client, theming
tokens from §2). No feature pages yet — just shell, sidebar/navbar, login, `/me`
wiring, light/dark theme toggle.

**Phase 1 — Accounting core + Super Admin basics** *(matches the prototype 1:1)*
Dashboard, Chart of Accounts, Journal Entry, General Ledger, Trial Balance, Balance
Sheet, Invoices, Proposals, Retainers, Bills, Expenses, Budget, Bank Accounts,
Transactions, Customers, Vendors, Inquiries, Leads Pipeline, Credit & Debit Notes, All
Reports, VAT Report, Corporate Tax, Scheduled Reports, Alerts, AI Assistant (usage
UI only — OCR/AI backend can stub). Super Admin: All Clients, Plans & Pricing,
Payments, Audit Log, platform Settings.

**Phase 2 — Inventory & expanded ops**
Products & SKU, Stock Movement, Multi-Warehouse, Purchase Orders/Goods Receipt,
Stock Transfers/Reorder Levels (per proposal §Inventory) — extends Purchasing/CRM
modules already scaffolded in Phase 1.

**Phase 3 — HR, scheduling, and channel add-ons**
HR/Payroll (employee profiles, attendance, leave, payroll runs, salary slips),
Calendar/Booking (staff scheduling, appointments, resource booking), Social Media
integration (post scheduling/publishing), POS module (Web/Android/iOS, barcode,
offline mode, cash drawer), Mobile companion app (Flutter).

Each phase should still deliver full responsiveness + dark mode per component, not as
a follow-up cleanup pass — see `Basic-Setup.md` §8.

---

## 6. Responsiveness rules (recap, product-specific)

- **Desktop (`lg:` and up)** must match the prototype pixel-for-pixel where a page
  exists in it (dense tables, sidebar width, card grids as shown).
- **Below `lg:`**: sidebar becomes an off-canvas drawer (per `Basic-Setup.md` §4);
  dense financial tables (ledger, trial balance, budget) convert to stacked
  card-per-row layouts with label:value pairs rather than horizontal scroll, since
  these are read-heavy reconciliation screens; dashboards reflow metric/stat grids
  from 4-up → 2-up → 1-up; the leads Kanban becomes horizontally swipeable columns.
- Down to **360px** width, per `Basic-Setup.md` §8 rule 1, for every new page.

---

## 7. Open items for client approval

Flag these explicitly when presenting — they're gaps or assumptions, not settled:

1. **Dark mode palette** (§2.1) is proposed, not client-supplied — the HTML mock is
   light-only. Needs sign-off before treating it as final.
2. **Sub-roles within a tenant** beyond Client Admin (approver, accountant, staff)
   aren't enumerated anywhere — needed for the Expense Approval Workflow and seat
   management to be buildable.
3. **Two realms vs. three** — confirm the public marketing site really has no
   feature/about pages beyond landing + pricing + login, or whether those should be
   scaffolded now even if empty.
4. **QR code on invoice PDFs** — client proposal notes it isn't explicitly promised;
   the mock's PDF preview includes a QR placeholder anyway. Confirm whether it ships.
5. **Windows POS support** — proposal explicitly excludes Windows as a POS platform
   (Web/Android/iOS only); confirm before Phase 3 planning.
