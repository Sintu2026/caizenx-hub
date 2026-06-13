# Caizenx Hub — Real Estate CRM

A CRM for **real estate project marketing** — from capturing leads, through converting
them to contacts, sending purchase contracts for e-signature, recording the sale into
inventory, and giving buyers a self-serve portal for their paperwork, communication and
change orders.

> The original **Investment Comparison Model** still ships with the app and lives at
> [`/investment`](./app/investment/page.tsx) (linked from the sidebar).

## Modules

| Module | Route | What it does |
|--------|-------|--------------|
| **Dashboard** | `/` | KPIs, lead pipeline funnel, project occupancy, recent activity |
| **Analytics** | `/analytics` | Revenue by project, trend, lead funnel, inventory mix, channel performance (Recharts) |
| **Leads** | `/leads` | Capture, score, assign, filter and log activity; convert lead → contact |
| **Contacts** | `/contacts` | Converted buyers with communication log, documents and linked contracts |
| **Contracts & e-Sign** | `/contracts` | Draft → Send → Sign (typed signature) → Countersign → Execute. Executing records the sale and generates commission |
| **Inventory** | `/inventory` | Per-project unit availability, pricing, status and buyer assignment |
| **Change Orders** | `/change-orders` | Buyer-requested upgrades with review/approval workflow |
| **Marketing** | `/marketing` | Campaign budget/spend, cost-per-lead and lead attribution |
| **Sales Team** | `/sales-team` | Advisor performance, targets, attainment and commission |
| **Commissions** | `/commissions` | Commission ledger with Pending → Approved → Paid workflow |
| **Buyer Portal** | `/portal` | Buyer-facing view: their home, documents, change requests and messaging |

## How the data works

This first version is a **self-contained demo**. It ships with realistic seeded data
(3 projects, 12 units, leads, contacts, contracts, campaigns, commissions and change
orders) and persists everything you change to the browser via `localStorage` — no
backend setup required. The shared state lives in [`lib/crm/store.tsx`](./lib/crm/store.tsx).

To wire it to a real backend later, the same actions in the store can be pointed at
Supabase (the client is already configured in [`lib/supabase.ts`](./lib/supabase.ts)).

## Tech Stack

- **Next.js 14** (App Router) + **React** + **TypeScript**
- **Tailwind CSS** for styling
- **Recharts** for analytics
- **Supabase** (optional, used by the investment model and available for the CRM)

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

Push to GitHub and import the repo into Vercel. For the investment model and any future
Supabase-backed CRM data, add these environment variables:

| Name | Notes |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

The app builds and runs without them (the CRM uses browser storage; the Supabase client
falls back to a placeholder).

## Project Structure

```
app/
  (app)/              # CRM route group (shares the sidebar shell)
    layout.tsx        # AppShell wrapper
    page.tsx          # Dashboard
    leads/  contacts/  contracts/  inventory/
    change-orders/  marketing/  sales-team/  commissions/  analytics/  portal/
  investment/page.tsx # Investment Comparison Model (original app)
  layout.tsx          # Root layout + CRMProvider
components/
  AppShell.tsx        # Sidebar + top bar
  ui.tsx              # Buttons, cards, badges, modal, etc.
lib/
  crm/                # types, seed data, store (localStorage), formatters
  supabase.ts         # Supabase client
```

---

Built for Caizenx Homes Ltd.
