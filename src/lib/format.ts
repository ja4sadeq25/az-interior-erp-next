export function bdt(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return "—";
  return "৳" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function bdtCompact(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return "—";
  const v = Number(n);
  if (v >= 1e7) return "৳" + (v / 1e7).toFixed(2) + " Cr";
  if (v >= 1e5) return "৳" + (v / 1e5).toFixed(1) + " L";
  return bdt(v);
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export const STATUS_LABEL: Record<string, string> = {
  design: "Design",
  procurement: "Procurement",
  execution: "Execution",
  finishing: "Finishing",
  handover: "Handover",
  completed: "Completed",
  on_track: "On Track",
  at_risk: "At Risk",
  delayed: "Delayed",
  not_started: "Not Started",
  in_progress: "In Progress",
  client_review: "Client Review",
  revision_requested: "Revision Requested",
  approved: "Approved",
  pending: "Pending",
  client_approved: "Client Approved",
  draft: "Draft",
  pending_approval: "Pending Approval",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
  sent: "Sent",
  paid: "Paid",
  partially_paid: "Partially Paid",
  overdue: "Overdue",
  under_review: "Under Review",
  construction_ready: "Construction Ready",
  open: "Open",
  resolved: "Resolved",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function statusColor(s: string): string {
  const map: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    client_approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    construction_ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
    on_track: "bg-emerald-50 text-emerald-700 border-emerald-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    execution: "bg-blue-50 text-blue-700 border-blue-200",
    client_review: "bg-violet-50 text-violet-700 border-violet-200",
    design: "bg-violet-50 text-violet-700 border-violet-200",
    sent: "bg-blue-50 text-blue-700 border-blue-200",
    partially_paid: "bg-amber-50 text-amber-700 border-amber-200",
    procurement: "bg-amber-50 text-amber-700 border-amber-200",
    pending_approval: "bg-amber-50 text-amber-700 border-amber-200",
    dispatched: "bg-blue-50 text-blue-700 border-blue-200",
    at_risk: "bg-amber-50 text-amber-700 border-amber-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    finishing: "bg-cyan-50 text-cyan-700 border-cyan-200",
    handover: "bg-indigo-50 text-indigo-700 border-indigo-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
    delayed: "bg-red-50 text-red-700 border-red-200",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    urgent: "bg-red-50 text-red-700 border-red-200",
    revision_requested: "bg-red-50 text-red-700 border-red-200",
    cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
    pending: "bg-neutral-100 text-neutral-600 border-neutral-200",
    not_started: "bg-neutral-100 text-neutral-500 border-neutral-200",
    draft: "bg-neutral-100 text-neutral-500 border-neutral-200",
    open: "bg-orange-50 text-orange-700 border-orange-200",
    under_review: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-neutral-100 text-neutral-600 border-neutral-200",
  };
  return map[s] ?? "bg-neutral-100 text-neutral-600 border-neutral-200";
}
