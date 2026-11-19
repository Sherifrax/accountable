import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useContacts, useOrganizations, useSaveDeal, useStages } from "../../api/hooks";
import type { Deal } from "../../api/types";
import { FormDialog } from "../../components/FormDialog";
import { FormField } from "../../components/FormField";
import { Select } from "../../components/Select";
import { cleanNumber } from "../../lib/format";
import { STAGE_NAMES } from "../../lib/stages";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  organization_id: z.string(),
  contact_id: z.string(),
  stage: z.string().min(1, "Stage is required"),
  value: z
    .string()
    .trim()
    .min(1, "Value is required")
    .refine((v) => /^\d+$/.test(cleanNumber(v)), "Value must be a whole number of dollars, 0 or more"),
  probability: z
    .string()
    .trim()
    .refine((v) => /^\d+$/.test(v) && Number(v) <= 100, "Probability must be a whole number from 0 to 100"),
  close_date: z.string(),
});
type Values = z.infer<typeof schema>;

type Props = {
  deal?: Pick<Deal, "id" | "name" | "organization_id" | "contact_id" | "stage" | "value" | "probability" | "close_date">;
  /** Choose the stage on a new deal (the "+" on a pipeline column). */
  stage?: string;
  /** Fill in the organization or contact on a new deal (from their pages). */
  organizationId?: number;
  contactId?: number;
  onClose: () => void;
  onSaved?: (deal: Deal) => void;
};

export function DealForm({ deal, stage, organizationId, contactId, onClose, onSaved }: Props) {
  const save = useSaveDeal();
  const stages = useStages();
  const organizations = useOrganizations();
  const contacts = useContacts();
  const usual = (name: string) => stages.data?.find((s) => s.name === name)?.probability;

  const initialStage = deal?.stage ?? stage ?? "New";
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: deal?.name ?? "",
      organization_id: String(deal?.organization_id ?? organizationId ?? ""),
      contact_id: String(deal?.contact_id ?? contactId ?? ""),
      stage: initialStage,
      value: deal ? String(deal.value) : "",
      probability: String(deal?.probability ?? usual(initialStage) ?? ""),
      close_date: deal?.close_date ?? "",
    },
  });

  const organization = watch("organization_id");
  const stageNow = watch("stage");
  const contactOptions = (contacts.data ?? []).filter((c) => !organization || String(c.organization_id) === organization);

  const submit = handleSubmit(async (v) => {
    try {
      const saved = await save.mutateAsync({
        id: deal?.id,
        input: {
          name: v.name,
          organization_id: v.organization_id ? Number(v.organization_id) : null,
          contact_id: v.contact_id ? Number(v.contact_id) : null,
          stage: v.stage,
          value: Number(cleanNumber(v.value)),
          probability: Number(v.probability),
          close_date: v.close_date || null,
        },
      });
      onClose();
      onSaved?.(saved);
    } catch {
      /* the hook has shown the message */
    }
  });

  const stageField = register("stage");
  const orgField = register("organization_id");

  return (
    <FormDialog title={deal ? "Edit deal" : "New deal"} onClose={onClose} onSubmit={submit} submitting={save.isPending}>
      <FormField label="Name" error={errors.name?.message}>
        <input {...register("name")} autoFocus autoComplete="off" />
      </FormField>
      <FormField label="Organization" half>
        <Select
          {...orgField}
          onChange={(e) => {
            void orgField.onChange(e);
            // Only that organization's contacts can be chosen; drop one that no longer fits.
            const current = contacts.data?.find((c) => String(c.id) === getValues("contact_id"));
            if (e.target.value && current && String(current.organization_id) !== e.target.value) {
              setValue("contact_id", "");
            }
          }}
        >
          <option value="">None</option>
          {(organizations.data ?? []).map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Contact" half>
        <Select {...register("contact_id")}>
          <option value="">None</option>
          {contactOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Stage" half error={errors.stage?.message}>
        <Select
          {...stageField}
          onChange={(e) => {
            void stageField.onChange(e);
            // A new stage brings its usual probability (R-DATA-2); typing one afterwards keeps it.
            const next = usual(e.target.value);
            if (next !== undefined) setValue("probability", String(next), { shouldValidate: true });
          }}
        >
          {STAGE_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Probability (%)" half error={errors.probability?.message} hint={usual(stageNow) !== undefined ? `Usual for ${stageNow}: ${usual(stageNow)}%` : undefined}>
        <input {...register("probability")} inputMode="numeric" autoComplete="off" />
      </FormField>
      <FormField label="Value (USD)" half error={errors.value?.message}>
        <input {...register("value")} inputMode="numeric" placeholder="12500" autoComplete="off" />
      </FormField>
      <FormField label="Close date" half>
        <input {...register("close_date")} type="date" />
      </FormField>
    </FormDialog>
  );
}
