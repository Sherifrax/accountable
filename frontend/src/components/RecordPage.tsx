import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function RecordHeader({
  crumb,
  title,
  facts,
  actions,
}: {
  crumb: { to: string; label: string };
  title: string;
  facts?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="panel rec-head">
      <div>
        <Link to={crumb.to} className="crumb">
          <ChevronLeft size={14} aria-hidden="true" /> {crumb.label}
        </Link>
        <h1 className="page-title">{title}</h1>
        {facts && <div className="facts">{facts}</div>}
      </div>
      {actions && <div className="head-acts">{actions}</div>}
    </div>
  );
}

export function Details({ items }: { items: [label: string, value: ReactNode][] }) {
  return (
    <dl className="details">
      {items.map(([label, value]) => (
        <div key={label} className="details-row">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ListRow({ main, sub, aside }: { main: ReactNode; sub?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="list-row">
      <div>
        <div>{main}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {aside && <div className="aside">{aside}</div>}
    </div>
  );
}
