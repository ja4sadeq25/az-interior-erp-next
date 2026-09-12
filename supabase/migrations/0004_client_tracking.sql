-- 0004 — Client project tracking (public, no login).
-- The client opens /track and enters their project code (AZ-C-001) plus the
-- phone number recorded on the project. No account, no password.
-- Mirrors the Luxerior Ops order-tracking model.

alter table projects add column if not exists client_last_viewed_at timestamptz;

create table if not exists track_attempts (
  ip text not null,
  at timestamptz not null default now()
);
create index if not exists track_attempts_ip_at_idx on track_attempts (ip, at);

create or replace function track_project(p_code text, p_phone text, p_ip text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  pr projects%rowtype;
  s  settings%rowtype;
  tries int;
  res jsonb;
begin
  -- brute-force guard: 5 failed lookups per IP per 15 minutes
  if p_ip is not null then
    select count(*) into tries from track_attempts where ip = p_ip and at > now() - interval '15 minutes';
    if tries >= 5 then raise exception 'too_many_attempts'; end if;
  end if;

  select * into pr from projects where upper(code) = upper(trim(p_code));
  if pr.id is null then
    if p_ip is not null then insert into track_attempts(ip) values (p_ip); end if;
    return null;
  end if;

  -- phone must match on the last 10 digits
  if pr.client_phone is null
     or right(regexp_replace(pr.client_phone, '[^0-9]', '', 'g'), 10)
        <> right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 10) then
    if p_ip is not null then insert into track_attempts(ip) values (p_ip); end if;
    return null;
  end if;

  select * into s from settings where id = 1;
  update projects set client_last_viewed_at = now() where id = pr.id;

  res := jsonb_build_object(
    'code', pr.code,
    'title', pr.title,
    'client_name', pr.client_name,
    'location', pr.location,
    'category', pr.category,
    'status', pr.status,
    'health', pr.health,
    'progress_pct', pr.progress_pct,
    'current_week', pr.current_week,
    'target_weeks', pr.target_weeks,
    'start_date', pr.start_date,
    'end_date', pr.end_date,
    'company_name', coalesce(s.company_name, 'AZ Architects'),
    'phases', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'phase_number', ph.phase_number,
        'title', ph.title,
        'week_timeline', ph.week_timeline,
        'description', ph.description,
        'status', ph.status,
        'approved_by_client', ph.approved_by_client,
        'client_approved_at', ph.client_approved_at,
        'mood_board_images', ph.mood_board_images,
        'renders_3d', ph.renders_3d,
        'deliverables', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'name', d.name, 'completed', d.completed, 'file_url', d.file_url
          ) order by d.name), '[]'::jsonb)
          from deliverables d where d.phase_id = ph.id
        )
      ) order by ph.phase_number), '[]'::jsonb)
      from design_phases ph where ph.project_id = pr.id
    ),
    'milestones', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'title', m.title,
        'phase', m.phase,
        'due_date', m.due_date,
        'completed_date', m.completed_date,
        'status', m.status,
        'bill_pct', m.bill_pct,
        'bill_amount', m.bill_amount
      ) order by m.due_date nulls last, m.title), '[]'::jsonb)
      from milestones m where m.project_id = pr.id
    )
  );
  return res;
end;
$$;

revoke all on function track_project(text, text, text) from public;
grant execute on function track_project(text, text, text) to anon, authenticated;
