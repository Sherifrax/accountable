import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useContacts } from "../../api/hooks";
import type { Contact, ContactStatus } from "../../api/types";
import { Async } from "../../components/Async";
import { Button } from "../../components/Button";
import { DataTable, type Column } from "../../components/DataTable";
import { DeleteRecordDialog } from "../../components/DeleteRecordDialog";
import { Plain, RecordLink } from "../../components/Links";
import { PageHeader } from "../../components/PageHeader";
import { Panel } from "../../components/Panel";
import { RowActions } from "../../components/RowActions";
import { StatusTag } from "../../components/Tag";
import { ContactForm } from "./ContactForm";

type Filter = "all" | ContactStatus;
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "customer", label: "Customer" },
];

/** Segmented filter with a count on each pill (R-TBL-4). */
export function StatusFilter({ contacts, value, onChange }: { contacts: Contact[]; value: Filter; onChange: (f: Filter) => void }) {
  const count = (f: Filter) => (f === "all" ? contacts.length : contacts.filter((c) => c.status === f).length);
  return (
    <div className="seg" role="group" aria-label="Filter by status">
      {FILTERS.map((f) => (
        <button key={f.value} type="button" aria-pressed={value === f.value} onClick={() => onChange(f.value)}>
          {f.label} <span className="n">{count(f.value)}</span>
        </button>
      ))}
    </div>
  );
}

export function ContactsPage() {
  const query = useContacts();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [form, setForm] = useState<{ contact?: Contact } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns = useMemo<Column<Contact>[]>(
    () => [
      { accessorKey: "name", header: "Name", meta: { strong: true }, cell: ({ row }) => <Link to={`/contacts/${row.original.id}`}>{row.original.name}</Link> },
      { accessorKey: "organization_name", header: "Organization", cell: ({ row }) => <RecordLink to={`/organizations/${row.original.organization_id}`} name={row.original.organization_name} /> },
      { accessorKey: "job_title", header: "Job title", cell: ({ row }) => <Plain value={row.original.job_title} /> },
      { accessorKey: "email", header: "Email", cell: ({ row }) => <Plain value={row.original.email} /> },
      { accessorKey: "phone", header: "Phone", cell: ({ row }) => <Plain value={row.original.phone} /> },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusTag status={row.original.status} /> },
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Contacts">
        <Button variant="primary" onClick={() => setForm({})}>
          <Plus size={16} aria-hidden="true" /> New contact
        </Button>
      </PageHeader>
      <Panel>
        <Async query={query} back={{ to: "/", label: "Go to the dashboard" }}>
          {(data) => (
            <DataTable
              noun="contacts"
              searchPlaceholder="Search contacts"
              data={filter === "all" ? data : data.filter((c) => c.status === filter)}
              columns={columns}
              visibleText={(c) => [c.name, c.organization_name, c.job_title, c.email, c.phone, c.status]}
              defaultSort={{ id: "name" }}
              rowKey={(c) => c.id}
              onRowClick={(c) => navigate(`/contacts/${c.id}`)}
              emptyMessage={filter === "all" ? "No contacts yet. Add one with New contact." : `No ${filter} contacts.`}
              toolbar={<StatusFilter contacts={data} value={filter} onChange={setFilter} />}
              rowActions={(c) => <RowActions name={c.name} onEdit={() => setForm({ contact: c })} onDelete={() => setDeleting(c.id)} />}
            />
          )}
        </Async>
      </Panel>
      {form && <ContactForm contact={form.contact} onClose={() => setForm(null)} />}
      <DeleteRecordDialog kind="contacts" id={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
