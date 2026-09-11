import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { getDict } from "@/lib/i18n/server";
import type { InventoryItem } from "@/lib/types";
import NewItemForm from "./new-item-form";
import StockControls from "./stock-controls";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const profile = await requireProfile();
  const t = await getDict();
  const canWrite = ["master", "admin", "procurement", "site_engineer"].includes(profile.role);
  const supabase = await createClient();
  const { data } = await supabase.from("inventory_items").select("*").order("name");
  const items = (data ?? []) as InventoryItem[];
  const low = items.filter((i) => Number(i.warehouse_stock) + Number(i.site_stock) <= Number(i.reorder_level)).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono text-neutral-400 dark:text-neutral-500">{t.inventory.kicker}</p>
          <h1 className="text-2xl font-bold tracking-tight">{t.inventory.heading}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{items.length} {t.inventory.skus} · {low} {t.inventory.reorderNote}</p>
        </div>
        {canWrite && <NewItemForm />}
      </header>

      {items.length === 0 ? (
        <div className="card p-12 text-center text-sm text-neutral-500 dark:text-neutral-400">{t.inventory.noItems}</div>
      ) : (
        <div className="table-wrap">
          <table className="w-full min-w-[880px]">
            <thead className="table-head">
              <tr>
                <th className="th">{t.inventory.thSku}</th>
                <th className="th">{t.inventory.thItem}</th>
                <th className="th">{t.inventory.thWarehouse}</th>
                <th className="th">{t.inventory.thSite}</th>
                <th className="th">{t.inventory.thReorder}</th>
                <th className="th">{t.inventory.thUnitCost}</th>
                <th className="th">{t.inventory.thLoc}</th>
                {canWrite && <th className="th">{t.inventory.thAdjust}</th>}
              </tr>
            </thead>
            <tbody className="table-body">
              {items.map((i) => {
                const isLow = Number(i.warehouse_stock) + Number(i.site_stock) <= Number(i.reorder_level);
                return (
                  <tr key={i.id} className={isLow ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}>
                    <td className="td mono">{i.sku ?? "—"}</td>
                    <td className="td">
                      <p className="font-semibold">{i.name}</p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">{i.category}</p>
                    </td>
                    <td className="td">{Number(i.warehouse_stock)} {i.unit}</td>
                    <td className="td">{Number(i.site_stock)} {i.unit}</td>
                    <td className="td text-xs">{Number(i.reorder_level)}{isLow && <span className="ml-1 text-amber-600 dark:text-amber-400">{t.inventory.low}</span>}</td>
                    <td className="td">৳{Number(i.unit_cost).toLocaleString()}</td>
                    <td className="td text-xs text-neutral-500 dark:text-neutral-400">{i.location ?? "—"} · {i.supplier_name ?? "—"}</td>
                    {canWrite && <td className="td"><StockControls item={i} /></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
