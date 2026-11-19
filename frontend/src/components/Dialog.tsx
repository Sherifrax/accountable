import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "./Button";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
};

/** Radix Dialog: traps focus, closes with Escape, and gives focus back when it closes (R-Q-5). */
export function Dialog({ open, onClose, title, description, children, footer }: Props) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="dialog-overlay" />
        <RadixDialog.Content className="dialog" {...(description ? {} : { "aria-describedby": undefined })}>
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
          {children}
          {footer && <div className="dlg-foot">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
