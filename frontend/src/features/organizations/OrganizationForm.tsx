import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSaveOrganization } from "../../api/hooks";
import type { Organization } from "../../api/types";
import { FormDialog } from "../../components/FormDialog";
import { FormField } from "../../components/FormField";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  industry: z.string().trim(),
  website: z.string().trim(),
  notes: z.string().trim(),
});
type Values = z.infer<typeof schema>;

type Props = {
  /** The organization to edit; leave out to add one. */
  organization?: Pick<Organization, "id" | "name" | "industry" | "website" | "notes">;
  onClose: () => void;
  onSaved?: (organization: Organization) => void;
};

export function OrganizationForm({ organization, onClose, onSaved }: Props) {
  const save = useSaveOrganization();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: organization?.name ?? "",
      industry: organization?.industry ?? "",
      website: organization?.website ?? "",
      notes: organization?.notes ?? "",
    },
  });

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync({
        id: organization?.id,
        input: {
          name: values.name,
          industry: values.industry || null,
          website: values.website || null,
          notes: values.notes || null,
        },
      });
      onClose();
      onSaved?.(saved);
    } catch {
      /* the hook has shown the message */
    }
  });

  return (
    <FormDialog title={organization ? "Edit organization" : "New organization"} onClose={onClose} onSubmit={submit} submitting={save.isPending}>
      <FormField label="Name" error={errors.name?.message}>
        <input {...register("name")} autoFocus autoComplete="off" />
      </FormField>
      <FormField label="Industry" half>
        <input {...register("industry")} autoComplete="off" />
      </FormField>
      <FormField label="Website" half>
        <input {...register("website")} placeholder="example.com" autoComplete="off" />
      </FormField>
      <FormField label="Notes">
        <textarea {...register("notes")} />
      </FormField>
    </FormDialog>
  );
}
