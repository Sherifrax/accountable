import { useState } from "react";
import { useDeleteActivity, useUpdateActivity } from "../../api/hooks";
import type { Activity, Deal } from "../../api/types";
import { ConfirmDeleteActivity } from "../../components/ConfirmDelete";
import { Timeline } from "../../components/Timeline";
import { ActivityForm } from "./ActivityForm";

/** A timeline with working Edit, Delete and done checkboxes (R-REC-4, R-ACT-2). */
export function ActivityTimeline(props: {
  activities: Activity[];
  hideContact?: boolean;
  hideDeal?: boolean;
  emptyMessage?: string;
  contactId?: number;
  contactDeals?: Deal[];
}) {
  const [editing, setEditing] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState<Activity | null>(null);
  const update = useUpdateActivity();
  const remove = useDeleteActivity();

  return (
    <>
      <Timeline
        activities={props.activities}
        hideContact={props.hideContact}
        hideDeal={props.hideDeal}
        emptyMessage={props.emptyMessage}
        onToggleDone={(a, done) => update.mutate({ id: a.id, input: { done } })}
        onEdit={setEditing}
        onDelete={setDeleting}
      />
      {editing && <ActivityForm activity={editing} onClose={() => setEditing(null)} />}
      <ConfirmDeleteActivity
        open={deleting !== null}
        type={deleting?.type ?? "activity"}
        busy={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            setDeleting(null);
          } catch {
            /* the hook has shown the message */
          }
        }}
      />
    </>
  );
}
