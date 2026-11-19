export type ContactStatus = "lead" | "qualified" | "customer";
export type ActivityType = "note" | "call" | "email" | "stage_change";

export type Stage = { name: string; probability: number; open: boolean };

export type Activity = {
  id: number;
  type: ActivityType;
  description: string;
  occurred_at: string;
  follow_up_date: string | null;
  done: boolean;
  overdue: boolean;
  from_stage: string | null;
  to_stage: string | null;
  contact_id: number | null;
  contact_name: string | null;
  deal_id: number | null;
  deal_name: string | null;
  editable: boolean;
};

export type Deal = {
  id: number;
  name: string;
  organization_id: number | null;
  organization_name: string | null;
  contact_id: number | null;
  contact_name: string | null;
  stage: string;
  value: number;
  probability: number;
  expected_revenue: number;
  close_date: string | null;
  late: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};
export type DealDetail = Deal & { timeline: Activity[] };

export type Contact = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  organization_id: number | null;
  organization_name: string | null;
  status: ContactStatus;
};
export type ContactDetail = Contact & { deals: Deal[]; timeline: Activity[] };

export type Organization = {
  id: number;
  name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
  contact_count: number;
};
export type OrganizationRow = Organization & { open_deal_count: number; open_pipeline_value: number };
export type OrganizationDetail = Omit<Organization, "contact_count"> & {
  contacts: Contact[];
  deals: Deal[];
  timeline: Activity[];
};

export type OrganizationImpact = { name: string; contacts: number; deals: number };
export type ContactImpact = { name: string; deals: number; activities_deleted: number; activities_kept: number };
export type DealImpact = { name: string; stage_changes: number; activities_deleted: number; activities_kept: number };

export type Dashboard = {
  tiles: {
    open_pipeline: { value: number; count: number };
    expected_revenue: { value: number };
    won_this_month: { value: number; last_month: number; change_percent: number | null };
    win_rate: { percent: number | null; won: number; lost: number };
  };
  months: { month: string; revenue: number; won: number; lost: number }[];
  funnel: { stage: string; value: number; count: number; kept_percent: number | null }[];
  open_by_stage: { stage: string; value: number; count: number }[];
  follow_ups: Activity[];
  recent_activity: Activity[];
};

// What the forms send.
export type OrganizationInput = { name: string; website?: string | null; industry?: string | null; notes?: string | null };
export type ContactInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  organization_id?: number | null;
  status: ContactStatus;
};
export type DealInput = {
  name: string;
  organization_id?: number | null;
  contact_id?: number | null;
  stage?: string;
  value: number;
  probability?: number | null;
  close_date?: string | null;
};
export type ActivityInput = {
  type: "note" | "call" | "email";
  description: string;
  contact_id?: number | null;
  deal_id?: number | null;
  occurred_at?: string | null;
  follow_up_date?: string | null;
};
