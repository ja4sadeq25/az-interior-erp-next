-- 0008 — 3D Artist role: the same access as Architect, money still masked.
--
-- Run the ALTER TYPE on its own first: Postgres will not let a new enum value
-- be referenced in the same transaction that adds it. The Supabase SQL editor
-- runs each Run as one transaction, so this file is meant to be run in two
-- passes — the alter, then everything below it.

alter type user_role add value if not exists '3d_artist' after 'architect';

-- ---- run everything below separately ----

drop policy if exists projects_staff_write on projects;
create policy projects_staff_write on projects for all to authenticated
  using (has_role('master','admin','project_manager','architect','3d_artist'))
  with check (has_role('master','admin','project_manager','architect','3d_artist'));

drop policy if exists phases_write on design_phases;
create policy phases_write on design_phases for all to authenticated
  using (has_role('master','admin','project_manager','architect','3d_artist'))
  with check (has_role('master','admin','project_manager','architect','3d_artist'));

drop policy if exists deliv_write on deliverables;
create policy deliv_write on deliverables for all to authenticated
  using (has_role('master','admin','project_manager','architect','3d_artist'))
  with check (has_role('master','admin','project_manager','architect','3d_artist'));

drop policy if exists ms_write on milestones;
create policy ms_write on milestones for all to authenticated
  using (has_role('master','admin','project_manager','finance','architect','3d_artist'))
  with check (has_role('master','admin','project_manager','finance','architect','3d_artist'));

drop policy if exists docs_write on documents;
create policy docs_write on documents for all to authenticated
  using (has_role('master','admin','project_manager','architect','3d_artist'))
  with check (has_role('master','admin','project_manager','architect','3d_artist'));

drop policy if exists logs_write on daily_logs;
create policy logs_write on daily_logs for all to authenticated
  using (has_role('master','admin','project_manager','site_engineer','architect','3d_artist'))
  with check (has_role('master','admin','project_manager','site_engineer','architect','3d_artist'));

drop policy if exists snags_write on snags;
create policy snags_write on snags for all to authenticated
  using (has_role('master','admin','project_manager','site_engineer','architect','3d_artist'))
  with check (has_role('master','admin','project_manager','site_engineer','architect','3d_artist'));

drop policy if exists dfiles_write on deliverable_files;
create policy dfiles_write on deliverable_files for all to authenticated
  using (has_role('master','admin','project_manager','architect','site_engineer','3d_artist'))
  with check (has_role('master','admin','project_manager','architect','site_engineer','3d_artist'));

drop policy if exists photos_storage_write on storage.objects;
create policy photos_storage_write on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and has_role('master','admin','project_manager','site_engineer','architect','finance','3d_artist'));

drop policy if exists docs_storage_write on storage.objects;
create policy docs_storage_write on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and has_role('master','admin','project_manager','site_engineer','architect','3d_artist'));

-- Documents an Architect can already see become visible to the 3D Artist too.
update documents set access_roles = array_append(access_roles, '3d_artist'::user_role)
where 'architect'::user_role = any(access_roles) and '3d_artist'::user_role <> all(access_roles);

-- Unchanged on purpose: sees_money() stays master/admin/finance, so the 3D
-- Artist sees masked amounts; billing, vendors and POs keep their own policies.
