import type { FormEvent, ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

type Props = {
  title: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitting?: boolean;
  submitLabel?: string;
  children: ReactNode;
};

/** A dialog holding a form with Cancel and Save (spec 4.4). Mount it only while it is open. */
export function FormDialog({ title, onClose, onSubmit, submitting, submitLabel = "Save", children }: Props) {
  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      onSubmit={onSubmit}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <div className="dlg-body">{children}</div>
    </Dialog>
  );
}
