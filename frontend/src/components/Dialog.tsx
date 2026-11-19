import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useRef } from "react";
import { IconButton } from "./Button";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** When given, the body and footer are one form, so Enter and the Save button submit it. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

/** Radix Dialog: traps focus, closes with Escape, and gives focus back when it closes (R-Q-5). */
export function Dialog({ open, onClose, title, description, children, footer, onSubmit }: Props) {
  // Dialogs here open from state, not from a Radix trigger, so give focus back by hand (R-Q-5).
  const opener = useRef<Element | null>(null);
  if (!open) opener.current = null;
  else if (opener.current === null) opener.current = document.activeElement;
  useEffect(() => {
    if (!open) return;
    return () => {
      const previous = opener.current as HTMLElement | null;
      if (previous && document.contains(previous)) previous.focus();
    };
  }, [open]);

  const body = (
    <>
      {children}
      {footer && <div className="dlg-foot">{footer}</div>}
    </>
  );
  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="dialog-overlay" />
        <RadixDialog.Content
          className="dialog"
          onOpenAutoFocus={(event) => {
            // Forms start in their first field rather than on the close button.
            const field = (event.currentTarget as HTMLElement).querySelector<HTMLElement>("input, textarea, select");
            if (onSubmit && field) {
              event.preventDefault();
              field.focus();
            }
          }}
          {...(description ? {} : { "aria-describedby": undefined })}>
          <div className="dlg-head">
            <RadixDialog.Title className="section-title">{title}</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton label="Close">
                <X size={16} />
              </IconButton>
            </RadixDialog.Close>
          </div>
          {description && (
            <RadixDialog.Description className="dlg-text">{description}</RadixDialog.Description>
          )}
          {onSubmit ? (
            <form onSubmit={onSubmit} noValidate>
              {body}
            </form>
          ) : (
            body
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
