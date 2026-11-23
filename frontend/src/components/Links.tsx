import { Link } from "react-router-dom";
import { websiteUrl } from "../lib/format";

/** A link to a record, or "None" when the record is missing or was deleted (R-REC-5). */
export function RecordLink({ to, name }: { to: string; name: string | null | undefined }) {
  if (!name) return <span className="link-none">None</span>;
  return (
    <Link to={to} onClick={(e) => e.stopPropagation()}>
      {name}
    </Link>
  );
}

export function WebsiteLink({ site }: { site: string | null | undefined }) {
  if (!site) return <span className="link-none">None</span>;
  return (
    <a href={websiteUrl(site)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
      {site}
    </a>
  );
}

export function Plain({ value }: { value: string | null | undefined }) {
  return value ? <>{value}</> : <span className="link-none">None</span>;
}
