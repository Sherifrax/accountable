import { MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDeal, useSaveDeal } from "../../api/hooks";
import { Async } from "../../components/Async";
import { Button } from "../../components/Button";
import { DeleteRecordDialog } from "../../components/DeleteRecordDialog";
import { Plain, RecordLink } from "../../components/Links";
import { Panel } from "../../components/Panel";
import { Details, RecordHeader } from "../../components/RecordPage";
import { Select } from "../../components/Select";
import { StageLabel } from "../../components/StageDot";
import { LateTag } from "../../components/Tag";
import { formatDate, money } from "../../lib/format";
import { STAGE_NAMES } from "../../lib/stages";
import { ActivityForm } from "../activities/ActivityForm";
import { ActivityTimeline } from "../activities/ActivityTimeline";
import { DealForm } from "./DealForm";

export function DealPage() {
  const id = Number(useParams().id);
  const query = useDeal(id);
  const navigate = useNavigate();
  const save = useSaveDeal();
  const [dialog, setDialog] = useState<"edit" | "log" | "delete" | null>(null);
  const close = () => setDialog(null);

  return (
    <Async query={query} back={{ to: "/deals", label: "Back to deals" }}>
      {(deal) => (
        <>
          <RecordHeader
            crumb={{ to: "/deals", label: "Deals" }}
            title={deal.name}
            facts={
              <>
                <StageLabel stage={deal.stage} />
                <LateTag late={deal.late} />
              </>
            }
            actions={
              <>
                <label className="stage-select">
                  <span className="sr-only">Stage</span>
                  <Select
                    aria-label="Stage"
                    value={deal.stage}
                    disabled={save.isPending}
                    onChange={(e) => save.mutate({ id: deal.id, input: { stage: e.target.value } })}
                  >
                    {STAGE_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </label>
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
                    ["Stage", <StageLabel key="s" stage={deal.stage} />],
                    ["Value", <span key="v" className="mono">{money(deal.value)}</span>],
                    ["Probability", <span key="p" className="mono">{deal.probability}%</span>],
                    ["Expected revenue", <span key="e" className="mono">{money(deal.expected_revenue)}</span>],
                    [
                      "Close date",
                      deal.close_date ? (
                        <span key="c" className="date-cell">
                          <span className="mono">{formatDate(deal.close_date)}</span>
                          <LateTag late={deal.late} />
                        </span>
                      ) : (
                        <Plain key="c" value={null} />
                      ),
                    ],
                    ["Organization", <RecordLink key="o" to={`/organizations/${deal.organization_id}`} name={deal.organization_name} />],
                    ["Contact", <RecordLink key="k" to={`/contacts/${deal.contact_id}`} name={deal.contact_name} />],
                  ]}
                />
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
              <ActivityTimeline activities={deal.timeline} hideDeal emptyMessage="No activity yet. Log a note, call or email." />
            </Panel>
          </div>
          {dialog === "edit" && <DealForm deal={deal} onClose={close} />}
          {dialog === "log" && <ActivityForm dealId={deal.id} onClose={close} />}
          <DeleteRecordDialog kind="deals" id={dialog === "delete" ? deal.id : null} onClose={close} onDeleted={() => navigate("/deals")} />
        </>
      )}
    </Async>
  );
}
