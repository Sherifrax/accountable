import { MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useContact } from "../../api/hooks";
import { Async } from "../../components/Async";
import { Button } from "../../components/Button";
import { DeleteRecordDialog } from "../../components/DeleteRecordDialog";
import { Plain, RecordLink } from "../../components/Links";
import { Panel } from "../../components/Panel";
import { Details, ListRow, RecordHeader } from "../../components/RecordPage";
import { StageLabel } from "../../components/StageDot";
import { LateTag, StatusTag } from "../../components/Tag";
import { money } from "../../lib/format";
import { ActivityForm } from "../activities/ActivityForm";
import { ActivityTimeline } from "../activities/ActivityTimeline";
import { ContactForm } from "./ContactForm";

export function ContactPage() {
  const id = Number(useParams().id);
  const query = useContact(id);
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<"edit" | "log" | "delete" | null>(null);
  const close = () => setDialog(null);

  return (
    <Async query={query} back={{ to: "/contacts", label: "Back to contacts" }}>
      {(contact) => (
        <>
          <RecordHeader
            crumb={{ to: "/contacts", label: "Contacts" }}
            title={contact.name}
            facts={
              <>
                <StatusTag status={contact.status} />
                {contact.job_title && <span className="muted">{contact.job_title}</span>}
              </>
            }
            actions={
              <>
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
                    [
                      "Organization",
                      <RecordLink
                        key="o"
                        to={`/organizations/${contact.organization_id}`}
                        name={contact.organization_name}
                      />,
                    ],
                    ["Job title", <Plain key="j" value={contact.job_title} />],
                    ["Email", <Plain key="e" value={contact.email} />],
                    ["Phone", <Plain key="p" value={contact.phone} />],
                    ["Status", <StatusTag key="s" status={contact.status} />],
                  ]}
                />
              </Panel>
              <Panel title={`Deals (${contact.deals.length})`}>
                {contact.deals.length === 0 && <p className="empty-note">No deals with this contact yet.</p>}
                {contact.deals.map((d) => (
                  <ListRow
                    key={d.id}
                    main={<Link to={`/deals/${d.id}`}>{d.name}</Link>}
                    sub={
                      <>
                        <StageLabel stage={d.stage} /> <LateTag late={d.late} />
                      </>
                    }
                    aside={<span className="mono">{money(d.value)}</span>}
                  />
                ))}
              </Panel>
            </div>
            <Panel
              title="Timeline"
              action={
                <Button onClick={() => setDialog("log")}>
                  <MessageSquarePlus size={16} aria-hidden="true" /> Log activity
                </Button>
              }
            >
              <ActivityTimeline
                activities={contact.timeline}
                hideContact
                emptyMessage="No activity yet. Log a note, call or email."
              />
            </Panel>
          </div>
          {dialog === "edit" && <ContactForm contact={contact} onClose={close} />}
          {dialog === "log" && <ActivityForm contactId={contact.id} contactDeals={contact.deals} onClose={close} />}
          <DeleteRecordDialog
            kind="contacts"
            id={dialog === "delete" ? contact.id : null}
            onClose={close}
            onDeleted={() => navigate("/contacts")}
          />
        </>
      )}
    </Async>
  );
}
