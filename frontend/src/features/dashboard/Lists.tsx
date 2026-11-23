import { Link } from "react-router-dom";
import { useUpdateActivity } from "../../api/hooks";
import type { Activity } from "../../api/types";
import { ActivityBadge, ActivityLinks, DoneCheckbox } from "../../components/Timeline";
import { OverdueTag } from "../../components/Tag";
import { followUpWording, formatDate, formatDateTime } from "../../lib/format";

function FollowUpItem({ a, onDone }: { a: Activity; onDone: (done: boolean) => void }) {
  return (
    <li className="fu">
      <DoneCheckbox activity={a} onChange={onDone} />
      <div>
        <div className="title">{a.description}</div>
        <div className="meta">
          <ActivityLinks activity={a} />
          <span>
            {formatDate(a.follow_up_date)} · {followUpWording(a.follow_up_date!)}
          </span>
          <OverdueTag overdue={a.overdue} />
        </div>
      </div>
    </li>
  );
}

/** Overdue first, then the next 7 days (R-DASH-5). Ticking one updates everything (R-ACT-3). */
export function FollowUps({ items }: { items: Activity[] }) {
  const update = useUpdateActivity();
  if (items.length === 0) return <p className="empty-note">Nothing due this week.</p>;
  const overdue = items.filter((a) => a.overdue);
  const soon = items.filter((a) => !a.overdue);
  const group = (label: string, list: Activity[]) =>
    list.length > 0 && (
      <>
        <div className="fu-group">{label}</div>
        <ul className="fu-list">
          {list.map((a) => (
            <FollowUpItem key={a.id} a={a} onDone={(done) => update.mutate({ id: a.id, input: { done } })} />
          ))}
        </ul>
      </>
    );
  return (
    <div>
      {group("Overdue", overdue)}
      {group("Due in the next 7 days", soon)}
    </div>
  );
}

export function RecentActivity({ items }: { items: Activity[] }) {
  if (items.length === 0) return <p className="empty-note">No activity yet. Log one from a contact or deal.</p>;
  return (
    <ul className="acts">
      {items.map((a) => (
        <li className="act" key={a.id}>
          <ActivityBadge activity={a} />
          <div className="text">
            {a.deal_id ? (
              <Link to={`/deals/${a.deal_id}`}>{a.description}</Link>
            ) : (
              <Link to={`/contacts/${a.contact_id}`}>{a.description}</Link>
            )}
          </div>
          <div className="meta">
            <span>{formatDateTime(a.occurred_at)}</span>
            <ActivityLinks activity={a} />
          </div>
        </li>
      ))}
    </ul>
  );
}
