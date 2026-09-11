"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustStock, issueToSite } from "@/app/actions/inventory";
import { useT } from "@/components/providers";
import type { InventoryItem } from "@/lib/types";

export default function StockControls({ item }: { item: InventoryItem }) {
  const router = useRouter();
  const t = useT();
  const [pending, start] = useTransition();
  const [wh, setWh] = useState(String(item.warehouse_stock));
  const [site, setSite] = useState(String(item.site_stock));
  const [qty, setQty] = useState("0");
  const [msg, setMsg] = useState<string | null>(null);

  function save() {
    start(async () => {
      const res = await adjustStock(item.id, wh, site);
      setMsg(res.error ?? t.common.saved);
      router.refresh();
    });
  }
  function issue() {
    start(async () => {
      const res = await issueToSite(item.id, qty);
      setMsg(res.error ?? t.inventory.issued);
      if (!res.error) setQty("0");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input className="input w-16 px-2 py-1 text-xs" type="number" min="0" value={wh} onChange={(e) => setWh(e.target.value)} title={t.inventory.warehouseTitle} />
      <input className="input w-16 px-2 py-1 text-xs" type="number" min="0" value={site} onChange={(e) => setSite(e.target.value)} title={t.inventory.siteTitle} />
      <button className="btn-ghost px-2 py-1 text-[11px]" onClick={save} disabled={pending}>{t.common.save}</button>
      <input className="input w-16 px-2 py-1 text-xs" type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} title={t.inventory.issueQty} />
      <button className="btn px-2 py-1 text-[11px]" onClick={issue} disabled={pending}>{t.inventory.toSite}</button>
      {msg && <span className="w-full text-[10px] text-neutral-500 dark:text-neutral-400">{msg}</span>}
    </div>
  );
}
