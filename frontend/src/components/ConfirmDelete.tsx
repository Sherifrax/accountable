import { plural } from "../lib/format";
import type { ContactImpact, DealImpact, OrganizationImpact } from "../api/types";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

export type DeleteTarget =
  | { kind: "organization"; impact: OrganizationImpact }
  | { kind: "contact"; impact: ContactImpact }
  | { kind: "deal"; impact: DealImpact };

const CANT_UNDO = "This can't be undone.";

/** The exact consequence wording for each kind, with counts (R-DEL-4). */
export function deleteMessage(target: DeleteTarget): string {
  switch (target.kind) {
    case "organization": {
      const { name, contacts, deals } = target.impact;
      const parts = [
        contacts > 0 ? plural(contacts, "contact") : null,
        deals > 0 ? plural(deals, "deal") : null,
      ].filter(Boolean);
      const effect =
        parts.length === 0
          ? "It has no contacts or deals."
          : `Its ${parts.join(" and ")} will be kept, with no organization.`;
      return `Delete ${name}? ${effect} ${CANT_UNDO}`;
    }
    case "contact": {
      const { name, deals, activities_deleted, activities_kept } = target.impact;
      const sentences: string[] = [];
      if (deals > 0) sentences.push(`Their ${plural(deals, "deal")} will be kept, with no contact.`);
      if (activities_deleted > 0)
        sentences.push(`${plural(activities_deleted, "activity", "activities")} linked only to them will be deleted.`);
      if (activities_kept > 0)
        sentences.push(`${plural(activities_kept, "activity", "activities")} also linked to a deal will be kept, with no contact.`);
      if (sentences.length === 0) sentences.push("They have no deals or activities.");
      return `Delete ${name}? ${sentences.join(" ")} ${CANT_UNDO}`;
    }
    case "deal": {
      const { name, stage_changes, activities_deleted, activities_kept } = target.impact;
      const gone = [
        stage_changes > 0 ? plural(stage_changes, "stage change") : null,
        activities_deleted > 0 ? plural(activities_deleted, "activity", "activities") : null,
      ].filter(Boolean);
      const sentences: string[] = [];
      if (gone.length > 0) sentences.push(`Its ${gone.join(" and ")} will be deleted.`);
      if (activities_kept > 0)
        sentences.push(`${plural(activities_kept, "activity", "activities")} also linked to a contact will be kept, with no deal.`);
      if (sentences.length === 0) sentences.push("It has no activities.");
      return `Delete ${name}? ${sentences.join(" ")} ${CANT_UNDO}`;
    }
  }
}

type Props = {
  /** Null keeps the dialog closed. */
  target: DeleteTarget | null;
  /** Shown while the counts are still loading. */
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
};

export function ConfirmDelete({ target, loading, onCancel, onConfirm, busy }: Props) {
  const label = target ? `Delete ${target.kind}` : "Delete";
  return (
    <Dialog
      open={target !== null || !!loading}
      onClose={onCancel}
      title={label}
      description={target ? deleteMessage(target) : "Checking what will be affected…"}
      footer={
        <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={!target || busy}>
            {label}
          </Button>
        </>
      }
    />
  );
}

/** Asks before deleting an activity (R-DEL-5). */
export function ConfirmDeleteActivity({
  type,
  open,
  onCancel,
  onConfirm,
  busy,
}: {
  type: string;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title="Delete activity"
      description={`Delete this ${type}? ${CANT_UNDO}`}
      footer={
        <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            Delete activity
          </Button>
        </>
      }
    />
  );
}
