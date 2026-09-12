-- 0002 — Architect role: full design-desk access like project_manager, minus money.
-- Architect can: projects, design roadmap (phases/deliverables), milestones,
--                documents (upload + status), site desk (daily logs, snags).
-- Architect cannot: see financial fields (masked), billing/invoices, write POs/vendors,
--                   convert consultancy → execution (it sets contract value).
--
-- IMPORTANT: Postgres requires a new enum value to be COMMITTED before it can be
-- referenced. This file therefore contains an explicit COMMIT right after the
-- ALTER TYPE — that is intentional and required when running the whole script in
-- the Supabase SQL editor. (If your tool wraps each file in a single transaction,
-- e.g. `supabase db push`, run the ALTER TYPE statement by itself first, then the rest.)

alter type user_role add value if not exists 'architect' after 'admin';
commit; -- no-op warning is harmless if the runner is already in autocommit mode

-- ---------------------------------------------------------------
-- RLS policies: architect joins project_manager everywhere that
-- is not money-related. (drop + recreate keeps the script re-runnable)
-- ---------------------------------------------------------------

drop policy if exists projects_staff_write on projects;
create policy projects_staff_write on projects for all to authenticated
  using (has_role('master', 'admin', 'project_manager', 'architect'))
  with check (has_role('master', 'admin', 'project_manager', 'architect'));

drop policy if exists phases_write on design_phases;
create policy phases_write on design_phases for all to authenticated
  using (has_role('master', 'admin', 'project_manager', 'architect'))
  with check (has_role('master', 'admin', 'project_manager', 'architect'));

drop policy if exists deliv_write on deliverables;
create policy deliv_write on deliverables for all to authenticated
  using (has_role('master', 'admin', 'project_manager', 'architect'))
  with check (has_role('master', 'admin', 'project_manager', 'architect'));

drop policy if exists ms_write on milestones;
create policy ms_write on milestones for all to authenticated
  using (has_role('master', 'admin', 'project_manager', 'finance', 'architect'))
  with check (has_role('master', 'admin', 'project_manager', 'finance', 'architect'));

drop policy if exists docs_write on documents;
create policy docs_write on documents for all to authenticated
  using (has_role('master', 'admin', 'project_manager', 'architect'))
  with check (has_role('master', 'admin', 'project_manager', 'architect'));

drop policy if exists logs_write on daily_logs;
create policy logs_write on daily_logs for all to authenticated
  using (has_role('master', 'admin', 'project_manager', 'site_engineer', 'architect'))
  with check (has_role('master', 'admin', 'project_manager', 'site_engineer', 'architect'));

drop policy if exists snags_write on snags;
create policy snags_write on snags for all to authenticated
  using (has_role('master', 'admin', 'project_manager', 'site_engineer', 'architect'))
  with check (has_role('master', 'admin', 'project_manager', 'site_engineer', 'architect'));

-- Documents storage bucket: architects can upload too
drop policy if exists docs_storage_write on storage.objects;
create policy docs_storage_write on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and has_role('master', 'admin', 'project_manager', 'site_engineer', 'architect'));

-- Existing documents that project_manager could already see become visible to architect
update documents set access_roles = array_append(access_roles, 'architect')
where 'project_manager' = any(access_roles) and 'architect' <> all(access_roles);

-- NOTE (unchanged on purpose):
--   sees_money()          → still master/admin/finance only (architect sees masked amounts)
--   convert_to_execution  → still master/admin/project_manager (sets contract value)
--   vendors/po/invoices   → still their original policies
