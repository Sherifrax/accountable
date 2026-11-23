import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDeals } from "../../api/hooks";
import type { Deal } from "../../api/types";
import { Async } from "../../components/Async";
import { Button } from "../../components/Button";
import { DataTable, type Column } from "../../components/DataTable";
import { DeleteRecordDialog } from "../../components/DeleteRecordDialog";
import { RecordLink } from "../../components/Links";
import { PageHeader } from "../../components/PageHeader";
import { Panel } from "../../components/Panel";
import { RowActions } from "../../components/RowActions";
import { StageLabel } from "../../components/StageDot";
import { LateTag } from "../../components/Tag";
import { formatDate, money } from "../../lib/format";
import { STAGE_NAMES } from "../../lib/stages";
import { DealForm } from "./DealForm";

export function DealsPage() {
  const query = useDeals();
  const navigate = useNavigate();
  const [form, setForm] = useState<{ deal?: Deal } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns = useMemo<Column<Deal>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        meta: { strong: true },
        cell: ({ row }) => <Link to={`/deals/${row.original.id}`}>{row.original.name}</Link>,
      },
      {
        accessorKey: "organization_name",
        header: "Organization",
        cell: ({ row }) => (
          <RecordLink to={`/organizations/${row.original.organization_id}`} name={row.original.organization_name} />
        ),
      },
      {
        accessorKey: "contact_name",
        header: "Contact",
        cell: ({ row }) => <RecordLink to={`/contacts/${row.original.contact_id}`} name={row.original.contact_name} />,
      },
      // Stages sort in pipeline order, not alphabetically.
      {
        id: "stage",
        accessorFn: (d) => STAGE_NAMES.indexOf(d.stage as (typeof STAGE_NAMES)[number]),
        header: "Stage",
        cell: ({ row }) => <StageLabel stage={row.original.stage} />,
      },
      { accessorKey: "value", header: "Value", meta: { align: "num" }, cell: ({ row }) => money(row.original.value) },
      {
        accessorKey: "probability",
        header: "Probability",
        meta: { align: "num" },
        cell: ({ row }) => `${row.original.probability}%`,
      },
      {
        accessorKey: "expected_revenue",
        header: "Expected revenue",
        meta: { align: "num" },
        cell: ({ row }) => money(row.original.expected_revenue),
      },
      {
        accessorKey: "close_date",
        header: "Close date",
        cell: ({ row }) => (
          <span className="date-cell">
            <span className="mono">{formatDate(row.original.close_date)}</span>
            <LateTag late={row.original.late} />
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Deals">
        <Button variant="primary" onClick={() => setForm({})}>
          <Plus size={16} aria-hidden="true" /> New deal
        </Button>
      </PageHeader>
      <Panel>
        <Async query={query} back={{ to: "/", label: "Go to the dashboard" }}>
          {(data) => (
            <DataTable
              noun="deals"
              searchPlaceholder="Search deals"
              data={data}
              columns={columns}
              visibleText={(d) => [
                d.name,
                d.organization_name,
                d.contact_name,
                d.stage,
                money(d.value),
                `${d.probability}%`,
                money(d.expected_revenue),
                formatDate(d.close_date),
                d.late ? "Late" : null,
              ]}
              defaultSort={{ id: "close_date" }}
              rowKey={(d) => d.id}
              onRowClick={(d) => navigate(`/deals/${d.id}`)}
              emptyMessage="No deals yet. Add one with New deal."
              rowActions={(d) => (
                <RowActions name={d.name} onEdit={() => setForm({ deal: d })} onDelete={() => setDeleting(d.id)} />
              )}
            />
          )}
        </Async>
      </Panel>
      {form && <DealForm deal={form.deal} onClose={() => setForm(null)} />}
      <DeleteRecordDialog kind="deals" id={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
