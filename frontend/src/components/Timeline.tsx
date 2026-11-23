import * as Checkbox from "@radix-ui/react-checkbox";
import { ArrowRight, Check, Mail, Pencil, Phone, StickyNote, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Activity } from "../api/types";
import { followUpWording, formatDate, formatDateTime } from "../lib/format";
import { stageStyle } from "../lib/stages";
import { IconButton } from "./Button";
import { EmptyState } from "./EmptyState";
import { OverdueTag } from "./Tag";

const ICONS = { note: StickyNote, call: Phone, email: Mail, stage_change: ArrowRight } as const;
const TYPE_LABEL = { note: "Note", call: "Call", email: "Email", stage_change: "Stage change" } as const;

export function ActivityBadge({ activity }: { activity: Activity }) {
  const Icon = ICONS[activity.type];
  const style =
    activity.type === "stage_change" && activity.to_stage
      ? { background: stageStyle(activity.to_stage).color, color: "var(--midnight)" }
      : undefined;
  return (
    <span className="badge" style={style} aria-hidden="true">
      <Icon size={15} />
    </span>
  );
}

/** The done checkbox shared by timelines and the dashboard (R-ACT-3). */
export function DoneCheckbox({ activity, onChange }: { activity: Activity; onChange: (done: boolean) => void }) {
  return (
    <Checkbox.Root
      className="checkbox"
      checked={activity.done}
      onCheckedChange={(value) => onChange(value === true)}
      aria-label={activity.done ? `Mark not done: ${activity.description}` : `Mark done: ${activity.description}`}
    >
      <Checkbox.Indicator>
        <Check size={13} strokeWidth={3} />
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}

/** Links to the records an activity belongs to, leaving out the one the page is already about. */
export function ActivityLinks({
  activity,
  hideContact,
  hideDeal,
}: {
  activity: Activity;
  hideContact?: boolean;
  hideDeal?: boolean;
}) {
  return (
    <>
      {activity.contact_id && !hideContact && (
        <Link to={`/contacts/${activity.contact_id}`}>{activity.contact_name}</Link>
      )}
      {activity.deal_id && !hideDeal && <Link to={`/deals/${activity.deal_id}`}>{activity.deal_name}</Link>}
    </>
  );
}

type Props = {
  activities: Activity[];
  hideContact?: boolean;
  hideDeal?: boolean;
  emptyMessage?: string;
  onToggleDone?: (activity: Activity, done: boolean) => void;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
};

export function Timeline({ activities, hideContact, hideDeal, emptyMessage, onToggleDone, onEdit, onDelete }: Props) {
  if (activities.length === 0) {
    return <EmptyState>{emptyMessage ?? "Nothing logged yet."}</EmptyState>;
  }
  return (
    <ol className="timeline">
      {activities.map((a) => (
        <li key={a.id} className="tl-item">
          <ActivityBadge activity={a} />
          <div className="text">{a.description}</div>
          <div className="meta">
            <span>{formatDateTime(a.occurred_at)}</span>
            <span aria-hidden="true">·</span>
            <span>{TYPE_LABEL[a.type]}</span>
            <ActivityLinks activity={a} hideContact={hideContact} hideDeal={hideDeal} />
          </div>
          {a.follow_up_date && (
            <div className="fu-line">
              {onToggleDone && <DoneCheckbox activity={a} onChange={(done) => onToggleDone(a, done)} />}
              <span className={a.done ? "done-text" : ""}>
                Follow up {formatDate(a.follow_up_date)}
                {!a.done && <> · {followUpWording(a.follow_up_date)}</>}
                {a.done && " · Done"}
              </span>
              <OverdueTag overdue={a.overdue} done={a.done} />
            </div>
          )}
          {a.editable && (onEdit || onDelete) && (
            <div className="tl-acts">
              {onEdit && (
                <IconButton label="Edit activity" onClick={() => onEdit(a)}>
                  <Pencil size={15} />
                </IconButton>
              )}
              {onDelete && (
                <IconButton label="Delete activity" danger onClick={() => onDelete(a)}>
                  <Trash2 size={15} />
                </IconButton>
              )}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
