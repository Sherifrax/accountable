import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "./Button";

export function RowActions({ name, onEdit, onDelete }: { name: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <>
      <IconButton label={`Edit ${name}`} onClick={onEdit}>
        <Pencil size={15} />
      </IconButton>
      <IconButton label={`Delete ${name}`} danger onClick={onDelete}>
        <Trash2 size={15} />
      </IconButton>
    </>
  );
}
