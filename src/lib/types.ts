export type Role =
  | "master"
  | "admin"
  | "architect"
  | "project_manager"
  | "site_engineer"
  | "procurement"
  | "finance"
  | "client";

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  department: string | null;
  avatar_url: string | null;
  role: Role;
  active: boolean;
  client_project_id: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: Role | null;
  action: string;
  entity: string;
  entity_id: string | null;
  entity_label: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ProjectCategory = "consultancy" | "execution";
export type ProjectStatus = "design" | "procurement" | "execution" | "finishing" | "handover" | "completed";
export type ProjectHealth = "on_track" | "at_risk" | "delayed";

export interface Project {
  id: string;
  code: string | null;
  title: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  location: string | null;
  ptype: "residential" | "commercial" | "hospitality" | "renovation";
  category: ProjectCategory;
  status: ProjectStatus;
  health: ProjectHealth;
  start_date: string | null;
  end_date: string | null;
  target_weeks: number | null;
  description: string | null;
  cover_image: string | null;
  consultancy_fee: number | null;
  current_week: number | null;
  quotation: Record<string, unknown> | null;
  has_converted: boolean;
  converted_execution_project_id: string | null;
  origin_consultancy_id: string | null;
  contract_value: number | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  progress_pct: number;
  spaces: { id?: string; name: string; area_sqft?: number }[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type DesignPhaseStatus = "not_started" | "in_progress" | "client_review" | "revision_requested" | "approved";

export interface DesignPhase {
  id: string;
  project_id: string;
  phase_number: number;
  title: string;
  week_timeline: string;
  description: string | null;
  status: DesignPhaseStatus;
  mood_board_notes: string | null;
  client_feedback: string | null;
  approved_by_client: boolean;
}

export interface Deliverable {
  id: string;
  phase_id: string;
  name: string;
  dtype: string;
  completed: boolean;
  notes: string | null;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  phase: string | null;
  due_date: string | null;
  completed_date: string | null;
  status: "pending" | "in_progress" | "completed" | "client_approved";
  bill_pct: number;
  bill_amount: number;
  deliverables: string[];
}

export interface Vendor {
  id: string;
  name: string;
  category: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  rating: number;
  payment_terms: string | null;
  active: boolean;
}

export type PoStatus = "draft" | "pending_approval" | "approved" | "dispatched" | "delivered" | "cancelled";

export interface PurchaseOrder {
  id: string;
  po_number: string | null;
  project_id: string | null;
  vendor_id: string | null;
  items: { itemName: string; category?: string; quantity: number; unit: string; unitPrice: number; total: number }[];
  total_amount: number;
  status: PoStatus;
  expected_delivery: string | null;
  delivered_date: string | null;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
  projects?: { title: string; code: string | null } | null;
  vendors?: { name: string } | null;
}

export interface InventoryItem {
  id: string;
  sku: string | null;
  name: string;
  category: string | null;
  unit: string;
  warehouse_stock: number;
  site_stock: number;
  allocated_stock: number;
  reorder_level: number;
  unit_cost: number;
  location: string | null;
  supplier_name: string | null;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "partially_paid" | "overdue";

export interface Invoice {
  id: string;
  invoice_number: string | null;
  project_id: string | null;
  client_name: string;
  client_email: string | null;
  issue_date: string;
  due_date: string | null;
  milestone_title: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  status: InvoiceStatus;
  payment_history: { date: string; amount: number; method: string; referenceNumber: string; note?: string }[];
  projects?: { title: string; code: string | null } | null;
}

export interface SecureDocument {
  id: string;
  project_id: string | null;
  title: string;
  category: string;
  file_type: string;
  file_size: string | null;
  version: string;
  uploaded_by: string | null;
  status: "draft" | "under_review" | "approved" | "construction_ready";
  description: string | null;
  file_path: string | null;
  created_at: string;
  projects?: { title: string; code: string | null } | null;
}

export interface DailyLog {
  id: string;
  project_id: string;
  log_date: string;
  engineer_name: string | null;
  weather: string;
  workers: { carpenters: number; masons: number; electricians: number; painters: number; plumbers: number; helpers: number };
  work_completed: string;
  challenges: string | null;
  materials_received: string | null;
  inspected_by: string | null;
  created_at: string;
  projects?: { title: string; code: string | null } | null;
}

export interface Snag {
  id: string;
  project_id: string;
  space_name: string | null;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved";
  assigned_to: string | null;
  reported_date: string;
  resolved_date: string | null;
  projects?: { title: string; code: string | null } | null;
}
