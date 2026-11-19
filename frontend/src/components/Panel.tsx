import type { HTMLAttributes, ReactNode } from "react";

export function Panel({ title, action, className = "", children, ...rest }: HTMLAttributes<HTMLElement> & { title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={`panel ${className}`.trim()} {...rest}>
      {(title || action) && (
        <div className="panel-head">
          {title && <h2 className="section-title">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
