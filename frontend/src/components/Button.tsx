import { forwardRef, type ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "secondary", className = "", type = "button", ...rest },
  ref,
) {
  return <button ref={ref} type={type} className={`btn btn-${variant} ${className}`.trim()} {...rest} />;
});

/** Icon-only button. A label is required so screen readers and the tooltip have something to say. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; danger?: boolean }
>(function IconButton({ label, danger, className = "", type = "button", children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={`btn btn-ghost ${danger ? "danger" : ""} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
});
