import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useOrganization } from "../../api/hooks";
import { Async } from "../../components/Async";
import { Button } from "../../components/Button";
import { DeleteRecordDialog } from "../../components/DeleteRecordDialog";
import { Plain, WebsiteLink } from "../../components/Links";
import { Panel } from "../../components/Panel";
import { Details, ListRow, RecordHeader } from "../../components/RecordPage";
import { StageLabel } from "../../components/StageDot";
import { LateTag, StatusTag } from "../../components/Tag";
import { money } from "../../lib/format";
import { ActivityTimeline } from "../activities/ActivityTimeline";
import { ContactForm } from "../contacts/ContactForm";
import { DealForm } from "../deals/DealForm";
import { OrganizationForm } from "./OrganizationForm";

type Dialogs = "edit" | "contact" | "deal" | "delete" | null;

export function OrganizationPage() {
  const id = Number(useParams().id);
  const query = useOrganization(id);
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<Dialogs>(null);
  const close = () => setDialog(null);

  return (
    <Async query={query} back={{ to: "/organizations", label: "Back to organizations" }}>
      {(org) => (
        <>
          <RecordHeader
            crumb={{ to: "/organizations", label: "Organizations" }}
            title={org.name}
            facts={org.industry ? <span className="muted">{org.industry}</span> : undefined}
            actions={
              <>
                <Button onClick={() => setDialog("contact")}>
                  <Plus size={16} aria-hidden="true" /> New contact
                </Button>
                <Button onClick={() => setDialog("deal")}>
                  <Plus size={16} aria-hidden="true" /> New deal
                </Button>
                <Button onClick={() => setDialog("edit")}>
                  <Pencil size={16} aria-hidden="true" /> Edit
                </Button>
                <Button onClick={() => setDialog("delete")}>
                  <Trash2 size={16} aria-hidden="true" /> Delete
                </Button>
              </>
            }
          />
          <div className="rec-grid">
            <div className="stack-col">
              <Panel title="Details">
                <Details
                  items={[
                    ["Website", <WebsiteLink key="w" site={org.website} />],
                    ["Industry", <Plain key="i" value={org.industry} />],
                    ["Notes", <Plain key="n" value={org.notes} />],
                  ]}
                />
              </Panel>
              <Panel title={`Contacts (${org.contacts.length})`}>
                {org.contacts.length === 0 && <p className="empty-note">No contacts yet. Add one with New contact.</p>}
                {org.contacts.map((c) => (
                  <ListRow key={c.id} main={<Link to={`/contacts/${c.id}`}>{c.name}</Link>} sub={c.job_title ?? undefined} aside={<StatusTag status={c.status} />} />
                ))}
              </Panel>
              <Panel title={`Deals (${org.deals.length})`}>
                {org.deals.length === 0 && <p className="empty-note">No deals yet. Add one with New deal.</p>}
                {org.deals.map((d) => (
                  <ListRow
                    key={d.id}
                    main={<Link to={`/deals/${d.id}`}>{d.name}</Link>}
                    sub={<><StageLabel stage={d.stage} /> <LateTag late={d.late} /></>}
                    aside={<span className="mono">{money(d.value)}</span>}
                  />
                ))}
              </Panel>
            </div>
            <Panel title="Timeline">
              <ActivityTimeline activities={org.timeline} emptyMessage="No activity yet. Log one from a contact or deal." />
            </Panel>
          </div>
          {dialog === "edit" && <OrganizationForm organization={org} onClose={close} />}
          {dialog === "contact" && <ContactForm organizationId={org.id} onClose={close} />}
          {dialog === "deal" && <DealForm organizationId={org.id} onClose={close} />}
          <DeleteRecordDialog kind="organizations" id={dialog === "delete" ? org.id : null} onClose={close} onDeleted={() => navigate("/organizations")} />
        </>
      )}
    </Async>
  );
}
