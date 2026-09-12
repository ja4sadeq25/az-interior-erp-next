-- 0006 — Two finance fixes.
--
-- 1. record_payment now accepts the date the money actually arrived, so a
--    payment received last week can be entered today without lying about when.
--    Future dates are rejected. Omitting it keeps the old behaviour (today).
-- 2. master_delete: the Master account can remove a record outright, the way
--    Luxerior Ops works. Child rows go first so nothing is orphaned. Every
--    deletion is written to activity_logs by the app before it happens.

drop function if exists record_payment(uuid, numeric, text, text, text);

create or replace function record_payment(
  invoice_id uuid, amount numeric, method text, ref text,
  note text default null, paid_on date default current_date
) returns void language plpgsql security definer set search_path = public as $$
declare inv invoices%rowtype;
begin
  if not has_role('master', 'admin', 'finance') then raise exception 'unauthorized'; end if;
  select * into inv from invoices where id = invoice_id;
  if not found then raise exception 'invoice not found'; end if;
  if amount <= 0 then raise exception 'amount must be positive'; end if;
  if paid_on > current_date then raise exception 'payment date cannot be in the future'; end if;

  update invoices set
    paid_amount = paid_amount + amount,
    payment_history = payment_history || jsonb_build_array(jsonb_build_object(
      'date', to_char(paid_on, 'YYYY-MM-DD'), 'amount', amount, 'method', method,
      'referenceNumber', coalesce(ref, ''), 'note', coalesce(note, ''))),
    status = case when paid_amount + amount >= total_amount then 'paid'::invoice_status else 'partially_paid'::invoice_status end
  where id = invoice_id;
end $$;

grant execute on function record_payment(uuid, numeric, text, text, text, date) to authenticated;

create or replace function master_delete(p_table text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare row_json jsonb; n int;
begin
  if not is_master() then raise exception 'only the Master account can delete records'; end if;

  if p_table not in ('invoices','projects','vendors','purchase_orders','inventory_items',
                     'documents','daily_logs','snags','milestones','deliverable_files') then
    raise exception 'deleting from % is not allowed', p_table;
  end if;

  execute format('select to_jsonb(t) from %I t where t.id = $1', p_table) into row_json using p_id;
  if row_json is null then raise exception 'record not found'; end if;

  if p_table = 'projects' then
    delete from deliverable_files where project_id = p_id;
    delete from deliverables where phase_id in (select id from design_phases where project_id = p_id);
    delete from design_phases where project_id = p_id;
    delete from milestones  where project_id = p_id;
    delete from daily_logs  where project_id = p_id;
    delete from snags       where project_id = p_id;
  elsif p_table = 'vendors' then
    if exists (select 1 from purchase_orders where vendor_id = p_id) then
      raise exception 'this vendor still has purchase orders — delete those first';
    end if;
  end if;

  execute format('delete from %I where id = $1', p_table) using p_id;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'nothing was deleted'; end if;
end $$;

grant execute on function master_delete(text, uuid) to authenticated;
