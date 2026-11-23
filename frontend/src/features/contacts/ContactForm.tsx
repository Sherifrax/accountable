import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useOrganizations, useSaveContact } from "../../api/hooks";
import type { Contact, ContactStatus } from "../../api/types";
import { FormDialog } from "../../components/FormDialog";
import { FormField } from "../../components/FormField";
import { Select } from "../../components/Select";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  status: z.enum(["lead", "qualified", "customer"], { error: "Choose a status" }),
  organization_id: z.string(),
  job_title: z.string().trim(),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || EMAIL.test(v), "Email doesn't look right"),
  phone: z.string().trim(),
});
type Values = z.infer<typeof schema>;

type Props = {
  contact?: Pick<Contact, "id" | "name" | "status" | "organization_id" | "job_title" | "email" | "phone">;
  /** Fills in the organization on a new contact (from an organization page). */
  organizationId?: number;
  onClose: () => void;
  onSaved?: (contact: Contact) => void;
};

/** Waits for the organizations so the select starts on the right one. */
export function ContactForm(props: Props) {
  const organizations = useOrganizations();
  return organizations.data !== undefined || organizations.isError ? <ContactFormFields {...props} /> : null;
}

function contactDefaults(contact: Props["contact"], organizationId?: number): Values {
  return {
    name: contact?.name ?? "",
    status: (contact?.status ?? "lead") as ContactStatus,
    organization_id: String(contact?.organization_id ?? organizationId ?? ""),
    job_title: contact?.job_title ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
  };
}

function contactInput(v: Values) {
  return {
    name: v.name,
    status: v.status,
    organization_id: v.organization_id ? Number(v.organization_id) : null,
    job_title: v.job_title || null,
    email: v.email || null,
    phone: v.phone || null,
  };
}

function ContactFormFields({ contact, organizationId, onClose, onSaved }: Props) {
  const save = useSaveContact();
  const organizations = useOrganizations();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: contactDefaults(contact, organizationId),
  });

  const submit = handleSubmit(async (v) => {
    try {
      const saved = await save.mutateAsync({ id: contact?.id, input: contactInput(v) });
      onClose();
      onSaved?.(saved);
    } catch {
      /* the hook has shown the message */
    }
  });

  return (
    <FormDialog
      title={contact ? "Edit contact" : "New contact"}
      onClose={onClose}
      onSubmit={submit}
      submitting={save.isPending}
    >
      <FormField label="Name" error={errors.name?.message}>
        <input {...register("name")} autoComplete="off" />
      </FormField>
      <FormField label="Status" half error={errors.status?.message}>
        <Select {...register("status")}>
          <option value="lead">Lead</option>
          <option value="qualified">Qualified</option>
          <option value="customer">Customer</option>
        </Select>
      </FormField>
      <FormField label="Organization" half>
        <Select {...register("organization_id")}>
          <option value="">None</option>
          {(organizations.data ?? []).map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Job title">
        <input {...register("job_title")} autoComplete="off" />
      </FormField>
      <FormField label="Email" half error={errors.email?.message}>
        <input {...register("email")} type="email" autoComplete="off" />
      </FormField>
      <FormField label="Phone" half>
        <input {...register("phone")} autoComplete="off" />
      </FormField>
    </FormDialog>
  );
}
