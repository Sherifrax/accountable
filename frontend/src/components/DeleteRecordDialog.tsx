import { type ImpactKind, useDeleteImpact, useDeleteRecord } from "../api/hooks";
import { ConfirmDelete, type DeleteTarget } from "./ConfirmDelete";

const SINGULAR = { organizations: "organization", contacts: "contact", deals: "deal" } as const;

type Props = {
  kind: ImpactKind;
  /** The record to delete; null keeps the dialog closed. */
  id: number | null;
  onClose: () => void;
  onDeleted?: () => void;
};

/** Looks up what deleting would affect, asks, then deletes (R-DEL-4). */
export function DeleteRecordDialog({ kind, id, onClose, onDeleted }: Props) {
  const impact = useDeleteImpact(kind, id);
  const remove = useDeleteRecord(kind);
  const target =
    id !== null && impact.data ? ({ kind: SINGULAR[kind], impact: impact.data } as DeleteTarget) : null;

  return (
    <ConfirmDelete
      target={target}
      loading={id !== null && impact.isLoading}
      busy={remove.isPending}
      onCancel={onClose}
      onConfirm={async () => {
        if (id === null) return;
        try {
          await remove.mutateAsync(id);
          onClose();
          onDeleted?.();
        } catch {
          /* the hook has shown the message */
        }
      }}
    />
  );
}
