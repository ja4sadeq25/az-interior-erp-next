import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { getDict } from "@/lib/i18n/server";
import { bdt, fmtDate, statusColor } from "@/lib/format";
import type { PurchaseOrder, Vendor } from "@/lib/types";
import PoStatusSelect from "./po-status";
import NewPoForm from "./new-po-form";
import NewVendorForm from "./new-vendor-form";

export const dynamic = "force-dynamic";

export default async function ProcurementPage() {
  const profile = await requireProfile();
  const t = await getDict();
  const canWrite = ["master", "admin", "procurement"].includes(profile.role);
  const supabase = await createClient();
  const [poRes, vendorRes, projRes] = await Promise.all([
    supabase.from("purchase_orders").select("*, projects(title, code), vendors(name)").order("created_at", { ascending: false }),
    supabase.from("vendors").select("*").order("name"),
    supabase.from("projects").select("id, code, title").order("created_at", { ascending: false }),
  ]);
  const pos = (poRes.data ?? []) as PurchaseOrder[];
  const vendors = (vendorRes.data ?? []) as Vendor[];
  const projects = (projRes.data ?? []) as { id: string; code: string; title: string }[];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono text-neutral-400 dark:text-neutral-500">{t.procurement.kicker}</p>
          <h1 className="text-2xl font-bold tracking-tight">{t.procurement.heading}</h1>
        </div>
      </header>

      {canWrite && <NewPoForm vendors={vendors} projects={projects} />}

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{t.procurement.posHeading}</h2>
        {pos.length === 0 ? (
          <div className="card p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">{t.procurement.noPos}</div>
        ) : (
          <div className="table-wrap">
            <table className="w-full min-w-[820px]">
              <thead className="table-head">
                <tr>
                  <th className="th">{t.procurement.thPo}</th>
                  <th className="th">{t.procurement.thProject}</th>
                  <th className="th">{t.procurement.thVendor}</th>
                  <th className="th">{t.procurement.thItems}</th>
                  <th className="th">{t.procurement.thTotal}</th>
                  <th className="th">{t.procurement.thExpected}</th>
                  <th className="th">{t.procurement.thStatus}</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {pos.map((po) => (
                  <tr key={po.id}>
                    <td className="td mono">{po.po_number}</td>
                    <td className="td text-xs">{po.projects?.title ?? "—"}</td>
                    <td className="td">{po.vendors?.name ?? "—"}</td>
                    <td className="td text-xs text-neutral-500 dark:text-neutral-400">
                      {po.items.slice(0, 2).map((i) => i.itemName).join(", ")}{po.items.length > 2 ? "…" : ""} ({po.items.length})
                    </td>
                    <td className="td font-semibold">{bdt(po.total_amount)}</td>
                    <td className="td text-xs">{fmtDate(po.expected_delivery)}</td>
                    <td className="td">
                      {canWrite ? (
                        <PoStatusSelect id={po.id} status={po.status} />
                      ) : (
                        <span className={`badge ${statusColor(po.status)}`}>{t.status[po.status]}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{t.procurement.vendorsHeading}</h2>
        {vendors.length === 0 ? (
          <div className="card p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">{t.procurement.noVendors}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {vendors.map((v) => (
              <div key={v.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{v.name}</h3>
                  <span className="mono text-amber-600 dark:text-amber-400">★ {Number(v.rating).toFixed(1)}</span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{v.category}</p>
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{v.contact_person} · {v.phone}</p>
                {v.payment_terms && <p className="mono mt-2 text-neutral-400 dark:text-neutral-500">{t.procurement.terms} {v.payment_terms}</p>}
              </div>
            ))}
          </div>
        )}
        {canWrite && <NewVendorForm />}
      </section>
    </div>
  );
}
