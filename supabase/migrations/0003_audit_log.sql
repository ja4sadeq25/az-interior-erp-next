-- 0003 — Audit log: chronological trail of key actions across the ERP.
-- Rows are written only by the app's server actions through the service-role key
-- (bypasses RLS), so there is deliberately no insert/update policy for users.
-- Reads are restricted to Master and Admin.

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  actor_name text not null,
  actor_role user_role,
  action text not null,          -- dot key, e.g. 'user.created' (translated in the UI)
  entity text not null,          -- user | project | purchase_order | invoice | payment | document
  entity_id text,
  entity_label text,             -- human-readable target, e.g. 'AZ-C-001 · Dhanmondi Residence'
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table activity_logs enable row level security;

create policy activity_read on activity_logs for select to authenticated
  using (has_role('master', 'admin'));

create index if not exists activity_logs_created_idx on activity_logs (created_at desc);
create index if not exists activity_logs_entity_idx on activity_logs (entity, created_at desc);
