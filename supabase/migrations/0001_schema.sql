-- AZ Interior ERP — schema v1 (mirrors the Luxerior Ops pattern)
-- Run in Supabase SQL editor on a fresh project.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------
create type user_role as enum ('master', 'admin', 'project_manager', 'site_engineer', 'procurement', 'finance', 'client');
create type project_type as enum ('residential', 'commercial', 'hospitality', 'renovation');
create type project_category as enum ('consultancy', 'execution');
create type project_status as enum ('design', 'procurement', 'execution', 'finishing', 'handover', 'completed');
create type project_health as enum ('on_track', 'at_risk', 'delayed');
create type design_phase_status as enum ('not_started', 'in_progress', 'client_review', 'revision_requested', 'approved');
create type milestone_status as enum ('pending', 'in_progress', 'completed', 'client_approved');
create type po_status as enum ('draft', 'pending_approval', 'approved', 'dispatched', 'delivered', 'cancelled');
create type invoice_status as enum ('draft', 'sent', 'paid', 'partially_paid', 'overdue');
create type doc_status as enum ('draft', 'under_review', 'approved', 'construction_ready');
create type snag_priority as enum ('low', 'medium', 'high', 'urgent');
create type snag_status as enum ('open', 'in_progress', 'resolved');

-- ---------------------------------------------------------------
-- Profiles (one per auth user) + role helpers
-- ---------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  title text,
  department text,
  avatar_url text,
  role user_role not null default 'project_manager',
  active boolean not null default true,
  client_project_id uuid,            -- for role 'client': the single project they can see
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function app_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and active
$$;

create or replace function is_master() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'master' from profiles where id = auth.uid() and active), false)
$$;

create or replace function has_role(variadic roles user_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = any(roles) from profiles where id = auth.uid() and active), false)
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role <> 'client' from profiles where id = auth.uid() and active), false)
$$;

create or replace function sees_money() returns boolean
language sql stable security definer set search_path = public as $$
  select has_role('master', 'admin', 'finance')
$$;

-- ---------------------------------------------------------------
-- Settings (single row)
-- ---------------------------------------------------------------
create table settings (
  id int primary key default 1 check (id = 1),
  company_name text not null default 'AZ Architects',
  company_tagline text not null default 'Enterprise ERP',
  vat_pct numeric(5,2) not null default 5,
  next_po_no int not null default 1,
  next_invoice_no int not null default 1,
  updated_at timestamptz not null default now()
);
insert into settings (id) values (1);

-- ---------------------------------------------------------------
-- Projects (consultancy design OR turnkey execution)
-- ---------------------------------------------------------------
create table projects (
  id uuid primary key default gen_random_uuid(),
  code text unique,                          -- assigned by trigger: AZ-C-001 / AZ-E-001
  title text not null,
  client_name text not null,
  client_email text,
  client_phone text,
  location text,
  ptype project_type not null default 'residential',
  category project_category not null default 'consultancy',
  status project_status not null default 'design',
  health project_health not null default 'on_track',
  start_date date,
  end_date date,
  target_weeks int,
  description text,
  cover_image text,
  consultancy_fee numeric(14,2),             -- money: master/admin/finance only (masked in UI)
  current_week int default 1,
  quotation jsonb,                           -- ExecutionQuotation draft
  has_converted boolean not null default false,
  converted_execution_project_id uuid,
  origin_consultancy_id uuid,
  contract_value numeric(14,2),              -- money
  estimated_cost numeric(14,2),              -- money
  actual_cost numeric(14,2) not null default 0,
  progress_pct int not null default 0,
  spaces jsonb not null default '[]',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create sequence project_c_seq;
create sequence project_e_seq;

create or replace function assign_project_code() returns trigger language plpgsql as $$
begin
  if new.code is null then
    if new.category = 'execution' then
      new.code := 'AZ-E-' || lpad(nextval('project_e_seq')::text, 3, '0');
    else
      new.code := 'AZ-C-' || lpad(nextval('project_c_seq')::text, 3, '0');
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger projects_code before insert on projects for each row execute function assign_project_code();

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger projects_touch before update on projects for each row execute function touch_updated_at();

-- ---------------------------------------------------------------
-- Design phases + deliverables (consultancy roadmap)
-- ---------------------------------------------------------------
create table design_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  phase_number int not null check (phase_number between 1 and 4),
  title text not null,
  week_timeline text not null,
  description text,
  status design_phase_status not null default 'not_started',
  mood_board_notes text,
  mood_board_images jsonb not null default '[]',
  renders_3d jsonb not null default '[]',
  client_feedback text,
  approved_by_client boolean not null default false,
  client_approved_at timestamptz,
  unique (project_id, phase_number)
);

create table deliverables (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references design_phases(id) on delete cascade,
  name text not null,
  dtype text not null default 'other',
  completed boolean not null default false,
  notes text,
  file_url text,
  updated_at timestamptz not null default now()
);

-- Standard 4-phase consultancy roadmap, auto-created for new consultancy projects
create or replace function seed_consultancy_phases() returns trigger language plpgsql as $$
declare ph uuid;
begin
  if new.category = 'consultancy' then
    insert into design_phases (project_id, phase_number, title, week_timeline, description, status) values
      (new.id, 1, 'Concept, Mood Board & 2D Spatial Layout', 'Week 1',
       'Establishing design aesthetics, client requirement brief, zoning, and 2D furniture layout plan.', 'in_progress'),
      (new.id, 2, 'Schematic 3D Digital Model & Photorealistic Visuals', 'Weeks 2-3',
       'Developing realistic 3D renderings, material mapping, ceiling concepts, and spatial walkthrough.', 'not_started'),
      (new.id, 3, 'Technical Working Drawings & Construction Specifications', 'Weeks 4-5',
       'Detailed architectural drawings for joinery, MEP conduits, false ceiling, and material specifications.', 'not_started'),
      (new.id, 4, 'Final Presentation & Turnkey Execution Quotation / BOQ', 'Week 6',
       'Consolidated design portfolio presentation, itemized turnkey execution quotation, and client sign-off.', 'not_started');

    select id into ph from design_phases where project_id = new.id and phase_number = 1;
    insert into deliverables (phase_id, name, dtype) values
      (ph, 'Client Requirement Brief & Space Program Sign-off', 'other'),
      (ph, 'Aesthetic Mood Board (Color palette, textures, lighting intent)', 'mood_board'),
      (ph, '2D Furniture & Circulation Layout Plan (Floor Plan)', 'layout_plan');

    select id into ph from design_phases where project_id = new.id and phase_number = 2;
    insert into deliverables (phase_id, name, dtype) values
      (ph, '3D Spatial Modeling (Volumetric massing & space proportions)', '3d_model'),
      (ph, 'Photorealistic 3D Renders: Living & Reception Areas', '3d_model'),
      (ph, 'Photorealistic 3D Renders: Master Suite & Kitchen/Dining', '3d_model'),
      (ph, 'Material & Surface Finish Board Approvals', 'mood_board');

    select id into ph from design_phases where project_id = new.id and phase_number = 3;
    insert into deliverables (phase_id, name, dtype) values
      (ph, 'Custom Joinery, Wardrobe & Kitchen Cabinetry Detailed Sections', 'working_drawing'),
      (ph, 'Electrical, Lighting Conduit & Automation Switching Layout', 'working_drawing'),
      (ph, 'Plumbing, Drainage & Sanitary Fixture Layouts', 'working_drawing'),
      (ph, 'Reflected Ceiling Plan (RCP), False Ceiling & AC Layout', 'working_drawing'),
      (ph, 'Marble, Granite & Premium Tile Pattern Layouts', 'working_drawing');

    select id into ph from design_phases where project_id = new.id and phase_number = 4;
    insert into deliverables (phase_id, name, dtype) values
      (ph, 'Consolidated Architectural Design Dossier (Full Book)', 'presentation'),
      (ph, 'Itemized Turnkey Execution Quotation & Bill of Quantities (BOQ)', 'quotation'),
      (ph, 'Client Final Design Sign-off & Execution Authorization', 'other');
  end if;
  return new;
end $$;
create trigger projects_seed_phases after insert on projects for each row execute function seed_consultancy_phases();

-- ---------------------------------------------------------------
-- Milestones (execution billing schedule)
-- ---------------------------------------------------------------
create table milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  phase text,
  due_date date,
  completed_date date,
  status milestone_status not null default 'pending',
  bill_pct numeric(5,2) not null default 0,
  bill_amount numeric(14,2) not null default 0,
  deliverables text[] not null default '{}'
);

-- Standard 5-milestone execution schedule (20/25/25/20/10 %), auto-created
create or replace function seed_execution_milestones(pid uuid, cv numeric) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into milestones (project_id, title, phase, due_date, status, bill_pct, bill_amount, deliverables) values
    (pid, 'Phase 1: Civil Modifications, Demolition & Site Setup', 'Site Prep & Civil', current_date + 21, 'in_progress', 20, round(cv * 0.20),
     array['Debris removal','Internal partition adjustments','Site safety and material hoarding setup']),
    (pid, 'Phase 2: MEP, Electrical Conduits & Ceiling Framing', 'Rough-in MEP', current_date + 45, 'pending', 25, round(cv * 0.25),
     array['Concealed electrical lines','False ceiling GI framing','Plumbing pressure tests']),
    (pid, 'Phase 3: Woodwork, Carpentry & Joinery Carcass', 'Custom Joinery', current_date + 75, 'pending', 25, round(cv * 0.25),
     array['Kitchen carcasses','Wardrobe frames','Veneer pressing & wall fluting panels']),
    (pid, 'Phase 4: Finishing, Painting, Marble Polishing & Fixtures', 'Finishing & Surfaces', current_date + 105, 'pending', 20, round(cv * 0.20),
     array['Travertine & tile installation','PU polishing & wall paints','Architectural lighting fixtures']),
    (pid, 'Phase 5: Deep Cleaning, Snag Rectification & Official Handover', 'Handover & Closeout', current_date + 120, 'pending', 10, round(cv * 0.10),
     array['Comprehensive snag audit rectification','Site deep cleaning','Keys and warranty booklet handover']);
end $$;

-- Convert an approved consultancy into a turnkey execution project
create or replace function convert_to_execution(consultancy_id uuid, cv numeric, sd date, ed date)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid; src projects%rowtype;
begin
  if not has_role('master', 'admin', 'project_manager') then raise exception 'unauthorized'; end if;
  select * into src from projects where id = consultancy_id;
  if not found then raise exception 'project not found'; end if;
  if src.category <> 'consultancy' then raise exception 'not a consultancy project'; end if;
  if src.has_converted then raise exception 'already converted'; end if;

  insert into projects (title, client_name, client_email, client_phone, location, ptype, category, status,
                        start_date, end_date, contract_value, estimated_cost, origin_consultancy_id, description, created_by)
  values ('[Execution] ' || src.title, src.client_name, src.client_email, src.client_phone, src.location,
          src.ptype, 'execution', 'execution', sd, ed, cv, cv, consultancy_id,
          'Turnkey execution converted from ' || coalesce(src.code, 'consultancy'), auth.uid())
  returning id into new_id;

  update projects set has_converted = true, converted_execution_project_id = new_id where id = consultancy_id;
  perform seed_execution_milestones(new_id, cv);
  return new_id;
end $$;

-- ---------------------------------------------------------------
-- Vendors & Purchase Orders
-- ---------------------------------------------------------------
create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  contact_person text,
  phone text,
  email text,
  rating numeric(3,1) not null default 0,
  payment_terms text,
  contract_file text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text unique,                   -- assigned by trigger: PO-0001
  project_id uuid references projects(id) on delete set null,
  vendor_id uuid references vendors(id) on delete set null,
  items jsonb not null default '[]',       -- [{itemName, category, quantity, unit, unitPrice, total}]
  total_amount numeric(14,2) not null default 0,
  status po_status not null default 'draft',
  expected_delivery date,
  delivered_date date,
  approved_by text,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function assign_po_number() returns trigger language plpgsql as $$
declare n int;
begin
  if new.po_number is null then
    update settings set next_po_no = next_po_no + 1 returning next_po_no - 1 into n;
    new.po_number := 'PO-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
  end if;
  return new;
end $$;
create trigger po_number before insert on purchase_orders for each row execute function assign_po_number();

-- ---------------------------------------------------------------
-- Inventory
-- ---------------------------------------------------------------
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  category text,
  unit text not null default 'pcs',
  warehouse_stock numeric(12,2) not null default 0,
  site_stock numeric(12,2) not null default 0,
  allocated_stock numeric(12,2) not null default 0,
  reorder_level numeric(12,2) not null default 0,
  unit_cost numeric(14,2) not null default 0,
  location text,
  supplier_name text,
  updated_at timestamptz not null default now()
);
create trigger inventory_touch before update on inventory_items for each row execute function touch_updated_at();

-- ---------------------------------------------------------------
-- Client invoices & payments
-- ---------------------------------------------------------------
create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique,              -- assigned by trigger: INV-0001
  project_id uuid references projects(id) on delete set null,
  client_name text not null,
  client_email text,
  client_address text,
  issue_date date not null default current_date,
  due_date date,
  milestone_title text,
  items jsonb not null default '[]',
  subtotal numeric(14,2) not null default 0,
  tax_rate numeric(5,2) not null default 5,
  tax_amount numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  status invoice_status not null default 'draft',
  payment_history jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create or replace function assign_invoice_number() returns trigger language plpgsql as $$
declare n int;
begin
  if new.invoice_number is null then
    update settings set next_invoice_no = next_invoice_no + 1 returning next_invoice_no - 1 into n;
    new.invoice_number := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
  end if;
  return new;
end $$;
create trigger invoice_number before insert on invoices for each row execute function assign_invoice_number();

create or replace function record_payment(invoice_id uuid, amount numeric, method text, ref text, note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare inv invoices%rowtype;
begin
  if not has_role('master', 'admin', 'finance') then raise exception 'unauthorized'; end if;
  select * into inv from invoices where id = invoice_id;
  if not found then raise exception 'invoice not found'; end if;
  if amount <= 0 then raise exception 'amount must be positive'; end if;

  update invoices set
    paid_amount = paid_amount + amount,
    payment_history = payment_history || jsonb_build_array(jsonb_build_object(
      'date', to_char(now(), 'YYYY-MM-DD'), 'amount', amount, 'method', method,
      'referenceNumber', coalesce(ref, ''), 'note', coalesce(note, ''))),
    status = case when paid_amount + amount >= total_amount then 'paid'::invoice_status else 'partially_paid'::invoice_status end
  where id = invoice_id;
end $$;

-- ---------------------------------------------------------------
-- Secure documents
-- ---------------------------------------------------------------
create table documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  title text not null,
  category text not null default 'blueprint',
  file_type text not null default 'PDF',
  file_size text,
  version text not null default 'v1.0',
  uploaded_by uuid references profiles(id),
  status doc_status not null default 'draft',
  access_roles user_role[] not null default '{master,admin,project_manager}',
  description text,
  file_path text,                          -- storage object path in bucket 'documents'
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Site: daily logs & snags
-- ---------------------------------------------------------------
create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  log_date date not null default current_date,
  engineer_name text,
  weather text not null default 'Sunny & Clear',
  workers jsonb not null default '{"carpenters":0,"masons":0,"electricians":0,"painters":0,"plumbers":0,"helpers":0}',
  work_completed text not null default '',
  challenges text,
  materials_received text,
  photos jsonb not null default '[]',
  inspected_by text,
  created_at timestamptz not null default now()
);

create table snags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  space_name text,
  description text not null,
  priority snag_priority not null default 'medium',
  status snag_status not null default 'open',
  assigned_to text,
  reported_date date not null default current_date,
  resolved_date date
);

-- ---------------------------------------------------------------
-- New auth user → profile (first user becomes master)
-- ---------------------------------------------------------------
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)), new.email,
          case when (select count(*) from profiles) = 0 then 'master'::user_role else 'project_manager'::user_role end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------
alter table profiles enable row level security;
alter table settings enable row level security;
alter table projects enable row level security;
alter table design_phases enable row level security;
alter table deliverables enable row level security;
alter table milestones enable row level security;
alter table vendors enable row level security;
alter table purchase_orders enable row level security;
alter table inventory_items enable row level security;
alter table invoices enable row level security;
alter table documents enable row level security;
alter table daily_logs enable row level security;
alter table snags enable row level security;

create policy profiles_read on profiles for select to authenticated using (is_staff());
create policy profiles_master on profiles for all to authenticated using (is_master()) with check (is_master());

create policy settings_read on settings for select to authenticated using (is_staff());
create policy settings_master on settings for update to authenticated using (is_master()) with check (is_master());

create policy projects_staff_read on projects for select to authenticated using (is_staff());
create policy projects_staff_write on projects for all to authenticated
  using (has_role('master', 'admin', 'project_manager')) with check (has_role('master', 'admin', 'project_manager'));
create policy projects_client_read on projects for select to authenticated
  using (has_role('client') and exists (select 1 from profiles p where p.id = auth.uid() and p.client_project_id = projects.id));

create policy phases_read on design_phases for select to authenticated using (is_staff());
create policy phases_write on design_phases for all to authenticated
  using (has_role('master', 'admin', 'project_manager')) with check (has_role('master', 'admin', 'project_manager'));
create policy deliv_read on deliverables for select to authenticated using (is_staff());
create policy deliv_write on deliverables for all to authenticated
  using (has_role('master', 'admin', 'project_manager')) with check (has_role('master', 'admin', 'project_manager'));

create policy ms_read on milestones for select to authenticated using (is_staff());
create policy ms_write on milestones for all to authenticated
  using (has_role('master', 'admin', 'project_manager', 'finance')) with check (has_role('master', 'admin', 'project_manager', 'finance'));

create policy vendors_read on vendors for select to authenticated using (is_staff());
create policy vendors_write on vendors for all to authenticated
  using (has_role('master', 'admin', 'procurement')) with check (has_role('master', 'admin', 'procurement'));
create policy po_read on purchase_orders for select to authenticated using (is_staff());
create policy po_write on purchase_orders for all to authenticated
  using (has_role('master', 'admin', 'procurement')) with check (has_role('master', 'admin', 'procurement'));
create policy inv_items_read on inventory_items for select to authenticated using (is_staff());
create policy inv_items_write on inventory_items for all to authenticated
  using (has_role('master', 'admin', 'procurement', 'site_engineer')) with check (has_role('master', 'admin', 'procurement', 'site_engineer'));

create policy invoices_read on invoices for select to authenticated using (sees_money());
create policy invoices_write on invoices for all to authenticated using (sees_money()) with check (sees_money());

create policy docs_read on documents for select to authenticated using (is_staff() and (is_master() or app_role() = any(access_roles)));
create policy docs_write on documents for all to authenticated
  using (has_role('master', 'admin', 'project_manager')) with check (has_role('master', 'admin', 'project_manager'));

create policy logs_read on daily_logs for select to authenticated using (is_staff());
create policy logs_write on daily_logs for all to authenticated
  using (has_role('master', 'admin', 'project_manager', 'site_engineer')) with check (has_role('master', 'admin', 'project_manager', 'site_engineer'));
create policy snags_read on snags for select to authenticated using (is_staff());
create policy snags_write on snags for all to authenticated
  using (has_role('master', 'admin', 'project_manager', 'site_engineer')) with check (has_role('master', 'admin', 'project_manager', 'site_engineer'));

-- ---------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('photos', 'photos', false) on conflict do nothing;

create policy docs_storage_read on storage.objects for select to authenticated using (bucket_id = 'documents' and is_staff());
create policy docs_storage_write on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and has_role('master', 'admin', 'project_manager', 'site_engineer'));
create policy photos_storage_read on storage.objects for select to authenticated using (bucket_id = 'photos' and is_staff());
create policy photos_storage_write on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and has_role('master', 'admin', 'project_manager', 'site_engineer'));
