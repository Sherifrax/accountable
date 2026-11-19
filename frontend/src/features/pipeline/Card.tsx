import { User } from "lucide-react";
import { Link } from "react-router-dom";
import type { Deal } from "../../api/types";
import { LateTag } from "../../components/Tag";
import { formatDate, money } from "../../lib/format";

/** The face of a deal card (R-PIPE-3). Used on the board and in the drag overlay. */
export function CardFace({ deal, link }: { deal: Deal; link?: boolean }) {
  return (
    <>
      <div className="name">
        {link ? (
          <Link to={`/deals/${deal.id}`} onClick={(e) => e.stopPropagation()}>
            {deal.name}
          </Link>
        ) : (
          deal.name
        )}
      </div>
      <div className="org">{deal.organization_name ?? "No organization"}</div>
      {deal.contact_name && (
        <div className="contact">
          <User size={13} aria-hidden="true" /> {deal.contact_name}
        </div>
      )}
      <div className="foot">
        <span className="value">{money(deal.value)}</span>
        <span className="date-cell">
          <LateTag late={deal.late} />
          <span className="date">{deal.close_date ? formatDate(deal.close_date) : "No date"}</span>
        </span>
      </div>
    </>
  );
}
