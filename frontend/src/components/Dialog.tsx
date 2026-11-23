import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
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
  // The element that had focus as the dialog opened is kept in state, since refs can't be read during render.
  const [wasOpen, setWasOpen] = useState(open);
  // A dialog is often mounted already open, so the first render captures the opener too.
  const [opener, setOpener] = useState<HTMLElement | null>(() =>
    open ? (document.activeElement as HTMLElement | null) : null,
  );
  if (open !== wasOpen) {
    setWasOpen(open);
    setOpener(open ? (document.activeElement as HTMLElement | null) : null);
  }
  useEffect(() => {
    if (!opener) return;
    return () => {
      if (document.contains(opener)) opener.focus();
    };
  }, [opener]);

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
            // Forms start in their first field rather than on the close button, or in the field marked data-autofocus.
            const root = event.currentTarget as HTMLElement;
            const field =
              root.querySelector<HTMLElement>("[data-autofocus]") ??
              root.querySelector<HTMLElement>("input, textarea, select");
            if (onSubmit && field) {
              event.preventDefault();
              field.focus();
            }
          }}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <div className="dlg-head">
            <RadixDialog.Title className="section-title">{title}</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton label="Close">
                <X size={16} />
              </IconButton>
            </RadixDialog.Close>
          </div>
          {description && <RadixDialog.Description className="dlg-text">{description}</RadixDialog.Description>}
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
