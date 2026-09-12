-- 0007 — Attach the money receipt to the payment itself.
-- A reference number can be mistyped or disputed; a photo of the deposit slip
-- or bKash confirmation cannot. The image lives in the private 'photos' bucket
-- and its path is stored inside the payment's own history entry.
--
-- This supersedes the record_payment signatures from 0001 and 0006: both are
-- dropped so only one version of the function exists.

drop function if exists record_payment(uuid, numeric, text, text, text);
drop function if exists record_payment(uuid, numeric, text, text, text, date);

create or replace function record_payment(
  invoice_id uuid, amount numeric, method text, ref text,
  note text default null, paid_on date default current_date, receipt_path text default null
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
      'referenceNumber', coalesce(ref, ''), 'note', coalesce(note, ''),
      'receipt', coalesce(receipt_path, ''))),
    status = case when paid_amount + amount >= total_amount then 'paid'::invoice_status else 'partially_paid'::invoice_status end
  where id = invoice_id;
end $$;

grant execute on function record_payment(uuid, numeric, text, text, text, date, text) to authenticated;

-- Finance needs to upload receipts into the photos bucket as well.
drop policy if exists photos_storage_write on storage.objects;
create policy photos_storage_write on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and has_role('master','admin','project_manager','site_engineer','architect','finance'));
