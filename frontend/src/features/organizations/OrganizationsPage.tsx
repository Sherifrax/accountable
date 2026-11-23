import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useOrganizations } from "../../api/hooks";
import type { OrganizationRow } from "../../api/types";
import { Async } from "../../components/Async";
import { Button } from "../../components/Button";
import { DataTable, type Column } from "../../components/DataTable";
import { DeleteRecordDialog } from "../../components/DeleteRecordDialog";
import { WebsiteLink, Plain } from "../../components/Links";
import { PageHeader } from "../../components/PageHeader";
import { Panel } from "../../components/Panel";
import { RowActions } from "../../components/RowActions";
import { money } from "../../lib/format";
import { OrganizationForm } from "./OrganizationForm";

export function OrganizationsPage() {
  const query = useOrganizations();
  const navigate = useNavigate();
  const [form, setForm] = useState<{ organization?: OrganizationRow } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns = useMemo<Column<OrganizationRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        meta: { strong: true },
        cell: ({ row }) => <Link to={`/organizations/${row.original.id}`}>{row.original.name}</Link>,
      },
      { accessorKey: "industry", header: "Industry", cell: ({ row }) => <Plain value={row.original.industry} /> },
      { accessorKey: "website", header: "Website", cell: ({ row }) => <WebsiteLink site={row.original.website} /> },
      { accessorKey: "contact_count", header: "Contacts", meta: { align: "num" } },
      { accessorKey: "open_deal_count", header: "Open deals", meta: { align: "num" } },
      {
        accessorKey: "open_pipeline_value",
        header: "Open pipeline",
        meta: { align: "num" },
        cell: ({ row }) => money(row.original.open_pipeline_value),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Organizations">
        <Button variant="primary" onClick={() => setForm({})}>
          <Plus size={16} aria-hidden="true" /> New organization
        </Button>
      </PageHeader>
      <Panel>
        <Async query={query} back={{ to: "/", label: "Go to the dashboard" }}>
          {(data) => (
            <DataTable
              noun="organizations"
              searchPlaceholder="Search organizations"
              data={data}
              columns={columns}
              visibleText={(o) => [
                o.name,
                o.industry,
                o.website,
                o.contact_count,
                o.open_deal_count,
                money(o.open_pipeline_value),
              ]}
              defaultSort={{ id: "name" }}
              rowKey={(o) => o.id}
              onRowClick={(o) => navigate(`/organizations/${o.id}`)}
              emptyMessage="No organizations yet. Add one with New organization."
              rowActions={(o) => (
                <RowActions
                  name={o.name}
                  onEdit={() => setForm({ organization: o })}
                  onDelete={() => setDeleting(o.id)}
                />
              )}
            />
          )}
        </Async>
      </Panel>
      {form && <OrganizationForm organization={form.organization} onClose={() => setForm(null)} />}
      <DeleteRecordDialog kind="organizations" id={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
