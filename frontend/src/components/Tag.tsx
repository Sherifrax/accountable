import type { ReactNode } from "react";

export type TagTone = "lead" | "qualified" | "customer" | "alert" | "info" | "quiet";

export function Tag({ tone = "quiet", children }: { tone?: TagTone; children: ReactNode }) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}

const STATUS_LABEL = { lead: "Lead", qualified: "Qualified", customer: "Customer" } as const;

export function StatusTag({ status }: { status: keyof typeof STATUS_LABEL }) {
  return <Tag tone={status}>{STATUS_LABEL[status]}</Tag>;
}

/** Raspberry tag for a deal that is open and past its close date (R-TBL-4, R-PIPE-3). */
export function LateTag({ late }: { late: boolean }) {
  return late ? <Tag tone="alert">Late</Tag> : null;
}

/** Raspberry tag for a follow-up that is past its date and not done (R-REC-4). */
export function OverdueTag({ overdue, done = false }: { overdue: boolean; done?: boolean }) {
  return overdue && !done ? <Tag tone="alert">Overdue</Tag> : null;
}
