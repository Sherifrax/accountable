import { useId, type HTMLAttributes, type ReactNode } from "react";

/** A white panel. When it has a title, the panel is a labelled region. */
export function Panel({ title, action, className = "", children, ...rest }: HTMLAttributes<HTMLElement> & { title?: ReactNode; action?: ReactNode }) {
  const titleId = useId();
  return (
    <section className={`panel ${className}`.trim()} aria-labelledby={title ? titleId : undefined} {...rest}>
      {(title || action) && (
        <div className="panel-head">
          {title && (
            <h2 className="section-title" id={titleId}>
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
