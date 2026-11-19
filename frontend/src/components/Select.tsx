import { ChevronDown } from "lucide-react";
import { forwardRef, type SelectHTMLAttributes } from "react";

/** A native select: fully keyboard and screen-reader friendly, styled to match the inputs. */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = "", children, ...rest },
  ref,
) {
  return (
    <span className="select-wrap">
      <select ref={ref} className={className} {...rest}>
        {children}
      </select>
      <ChevronDown size={16} aria-hidden="true" />
    </span>
  );
});
