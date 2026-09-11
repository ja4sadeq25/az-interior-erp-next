# AZ Interior ERP

Enterprise ERP for **AZ Architects** — consultancy design roadmaps, turnkey execution projects, procurement & vendors, material inventory, client billing with automated profit visibility, secure document management, daily site logs & snags, and role-based staff logins with a Master Account.

Built on the same production stack as **Luxerior Ops**: Next.js (App Router) · Supabase (Postgres, Auth, Storage, RLS) · Tailwind v4 · Vercel.

## Roles

| Role | Can |
|---|---|
| master | everything — users, settings, all modules, all money |
| admin | all modules and money |
| project_manager | projects, design roadmap, milestones, documents, site desk — no billing |
| site_engineer | daily site logs, snags, stock issue — no money |
| procurement | vendors, purchase orders, inventory |
| finance | billing/invoices, payments, project money columns |
| client | read-only portal bound to one project (Master assigns it) |

The **first user created becomes master** automatically (trigger in `0001_schema.sql`). Financial fields (consultancy fee, contract value, costs, invoices) are visible only to master/admin/finance — masked everywhere else.

## First-time setup (≈ 20 min)

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (region: Singapore). Save the database password.
2. SQL Editor → paste **`supabase/migrations/0001_schema.sql`** → Run. (Creates all tables, enums, role helpers, RLS policies, triggers, and the `documents` / `photos` storage buckets.)
3. Authentication → Providers → Email: keep enabled; **turn off “Confirm email”** (staff accounts are created by the Master, not self-signup).
4. Authentication → Users → **Add user** → your email + password (tick “auto confirm”). This first user becomes master.
5. Project Settings → API: copy **Project URL**, **anon public** key, **service_role** key.

### 2. Local run

```bash
cp .env.example .env.local   # fill in the three Supabase values + NEXT_PUBLIC_APP_URL
npm install
npm run dev                  # http://localhost:3000 → log in with the master user
```

### 3. Vercel deployment

1. Import this GitHub repo into [vercel.com](https://vercel.com). Framework: **Next.js** (auto-detected).
2. Environment variables: everything from `.env.example` —
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   and `NEXT_PUBLIC_APP_URL=https://erp.azarchitects.com` (your chosen domain).
3. Deploy.

### 4. Domain connection (same pattern as Luxerior Ops)

The app itself needs **no domain-specific code** — the connection is done in Vercel + your DNS provider:

1. **Vercel → project → Settings → Domains** → add your subdomain, e.g. `erp.azarchitects.com`.
2. Vercel shows a DNS record to add — usually a **CNAME** pointing to `cname.vercel-dns.com`
   (or an **A** record `76.76.21.21` for an apex domain).
3. Go to your domain registrar / hosting DNS panel (e.g. **Hostinger → DNS / Nameservers**) and add that record:
   - Type: `CNAME`
   - Host/Name: `erp` (the subdomain part)
   - Points to: `cname.vercel-dns.com`
   - TTL: default / 3600
4. Back in Vercel, the domain turns **Valid** once DNS propagates (usually minutes, up to 48 h). HTTPS certificates are issued automatically.
5. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to the final https URL if you changed it.

> For reference, Luxerior Ops connects `app.luxerior.com.bd` with the exact same flow: add domain in Vercel → paste the shown CNAME into Hostinger DNS.

### 5. Staff

Master → **Team & Security** → add each person with a role and a temporary password (they change it after first login). For a **client portal** login, create a user with role *Client Portal* and bind it to their project — they will see only that project, read-only.

## Project map

```
supabase/migrations/0001_schema.sql   schema, enums, RLS, triggers:
                                      - assign_project_code (AZ-C-001 / AZ-E-001)
                                      - seed_consultancy_phases (standard 4-phase design roadmap)
                                      - seed_execution_milestones (20/25/25/20/10 billing schedule)
                                      - convert_to_execution (approved design → turnkey project)
                                      - assign_po_number / assign_invoice_number (counters in settings)
                                      - record_payment (updates totals + history + status)
src/proxy.ts                          auth redirect middleware
src/lib/supabase/                     browser / server / service-role clients
src/lib/session.ts                    requireProfile (role guard)
src/app/(app)/                        dashboard, projects (+ design roadmap / milestones),
                                      site desk, procurement, inventory, billing, documents, users
src/app/login                         Supabase email/password sign-in
```
