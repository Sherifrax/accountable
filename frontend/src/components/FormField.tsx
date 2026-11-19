import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

type Props = {
  label: string;
  error?: string;
  hint?: string;
  half?: boolean;
  children: ReactElement<Record<string, unknown>>;
};

/** A label above a control, with the error in plain words underneath (R-Q-3). */
export function FormField({ label, error, hint, half, children }: Props) {
  const id = useId();
  const errorId = `${id}-error`;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
      })
    : children;
  return (
    <div className={`field ${half ? "half" : ""} ${error ? "invalid" : ""}`.trim()}>
      <label htmlFor={id}>{label}</label>
      {control as ReactNode}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && (
        <span className="err" id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
