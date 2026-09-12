-- 0005 — Proof files on deliverables + a project progress gallery.
-- A tick says a step is done; a file proves it. Staff upload images/PDFs against
-- each deliverable; only files explicitly marked client_visible reach /track.

create table if not exists deliverable_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  phase_id uuid references design_phases(id) on delete cascade,
  deliverable_id uuid references deliverables(id) on delete cascade,
  storage_path text not null,              -- object path inside the 'photos' bucket
  file_name text not null,
  mime text,
  size_bytes bigint,
  caption text,
  client_visible boolean not null default false,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists deliverable_files_project_idx on deliverable_files (project_id, created_at desc);
create index if not exists deliverable_files_deliverable_idx on deliverable_files (deliverable_id);

alter table deliverable_files enable row level security;

drop policy if exists dfiles_read on deliverable_files;
create policy dfiles_read on deliverable_files for select to authenticated using (is_staff());

drop policy if exists dfiles_write on deliverable_files;
create policy dfiles_write on deliverable_files for all to authenticated
  using (has_role('master','admin','project_manager','architect','site_engineer'))
  with check (has_role('master','admin','project_manager','architect','site_engineer'));

-- architects upload progress photos too
drop policy if exists photos_storage_write on storage.objects;
create policy photos_storage_write on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and has_role('master','admin','project_manager','site_engineer','architect'));

-- Rebuild the tracking payload so the client sees the proof files too.
create or replace function track_project(p_code text, p_phone text, p_ip text default null) returns jsonb language plpgsql security definer set search_path = public as $x$ declare pr projects%rowtype; s settings%rowtype; tries int; res jsonb; begin if p_ip is not null then select count(*) into tries from track_attempts where ip = p_ip and at > now() - interval '15 minutes'; if tries >= 5 then raise exception 'too_many_attempts'; end if; end if; select * into pr from projects where upper(code) = upper(trim(p_code)); if pr.id is null then if p_ip is not null then insert into track_attempts(ip) values (p_ip); end if; return null; end if; if pr.client_phone is null or right(regexp_replace(pr.client_phone, '[^0-9]', '', 'g'), 10) <> right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 10) then if p_ip is not null then insert into track_attempts(ip) values (p_ip); end if; return null; end if; select * into s from settings where id = 1; update projects set client_last_viewed_at = now() where id = pr.id; res := jsonb_build_object('code', pr.code, 'title', pr.title, 'client_name', pr.client_name, 'location', pr.location, 'category', pr.category, 'status', pr.status, 'health', pr.health, 'progress_pct', pr.progress_pct, 'current_week', pr.current_week, 'target_weeks', pr.target_weeks, 'start_date', pr.start_date, 'end_date', pr.end_date, 'company_name', coalesce(s.company_name, 'AZ Architects'), 'phases', (select coalesce(jsonb_agg(jsonb_build_object('phase_number', ph.phase_number, 'title', ph.title, 'week_timeline', ph.week_timeline, 'description', ph.description, 'status', ph.status, 'approved_by_client', ph.approved_by_client, 'client_approved_at', ph.client_approved_at, 'mood_board_images', ph.mood_board_images, 'renders_3d', ph.renders_3d, 'deliverables', (select coalesce(jsonb_agg(jsonb_build_object('name', d.name, 'completed', d.completed, 'files', (select coalesce(jsonb_agg(jsonb_build_object('path', f.storage_path, 'name', f.file_name, 'mime', f.mime, 'caption', f.caption, 'at', f.created_at) order by f.created_at), '[]'::jsonb) from deliverable_files f where f.deliverable_id = d.id and f.client_visible)) order by d.name), '[]'::jsonb) from deliverables d where d.phase_id = ph.id)) order by ph.phase_number), '[]'::jsonb) from design_phases ph where ph.project_id = pr.id), 'gallery', (select coalesce(jsonb_agg(jsonb_build_object('path', f.storage_path, 'name', f.file_name, 'mime', f.mime, 'caption', f.caption, 'at', f.created_at, 'phase_number', ph.phase_number, 'phase_title', ph.title) order by f.created_at desc), '[]'::jsonb) from deliverable_files f left join design_phases ph on ph.id = f.phase_id where f.project_id = pr.id and f.client_visible), 'milestones', (select coalesce(jsonb_agg(jsonb_build_object('title', m.title, 'phase', m.phase, 'due_date', m.due_date, 'completed_date', m.completed_date, 'status', m.status, 'bill_pct', m.bill_pct, 'bill_amount', m.bill_amount) order by m.due_date nulls last, m.title), '[]'::jsonb) from milestones m where m.project_id = pr.id)); return res; end; $x$;

revoke all on function track_project(text, text, text) from public;
grant execute on function track_project(text, text, text) to anon, authenticated;
