import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateActivity, useUpdateActivity } from "../../api/hooks";
import type { Activity, Deal } from "../../api/types";
import { FormDialog } from "../../components/FormDialog";
import { FormField } from "../../components/FormField";
import { Select } from "../../components/Select";
import { toInputDateTime } from "../../lib/format";

const schema = z.object({
  type: z.enum(["note", "call", "email"]),
  description: z.string().trim().min(1, "Description is required"),
  occurred_at: z.string().min(1, "Date and time are required"),
  follow_up_date: z.string(),
  done: z.boolean(),
  deal: z.string(),
});
type Values = z.infer<typeof schema>;

type Props = {
  /** The activity to edit; leave out to log a new one. */
  activity?: Activity;
  /** On a deal page: the contact is filled in on the server. */
  dealId?: number;
  /** On a contact page, with an optional picker of that contact's deals (R-ACT-1). */
  contactId?: number;
  contactDeals?: Deal[];
  onClose: () => void;
};

export function ActivityForm({ activity, dealId, contactId, contactDeals, onClose }: Props) {
  const create = useCreateActivity();
  const update = useUpdateActivity("Activity saved");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: (activity && activity.type !== "stage_change" ? activity.type : "note") as Values["type"],
      description: activity?.description ?? "",
      occurred_at: toInputDateTime(activity?.occurred_at ?? new Date()),
      follow_up_date: activity?.follow_up_date ?? "",
      done: activity?.done ?? false,
      deal: "",
    },
  });
  const followUp = watch("follow_up_date");

  const submit = handleSubmit(async (v) => {
    try {
      if (activity) {
        await update.mutateAsync({
          id: activity.id,
          input: {
            type: v.type,
            description: v.description,
            occurred_at: v.occurred_at,
            follow_up_date: v.follow_up_date || null,
            done: v.follow_up_date ? v.done : false,
          },
        });
      } else {
        await create.mutateAsync({
          type: v.type,
          description: v.description,
          occurred_at: v.occurred_at,
          follow_up_date: v.follow_up_date || null,
          contact_id: contactId ?? null,
          deal_id: dealId ?? (v.deal ? Number(v.deal) : null),
        });
      }
      onClose();
    } catch {
      /* the hook has shown the message */
    }
  });

  return (
    <FormDialog
      title={activity ? "Edit activity" : "Log activity"}
      onClose={onClose}
      onSubmit={submit}
      submitting={create.isPending || update.isPending}
    >
      <FormField label="Type" half>
        <Select {...register("type")}>
          <option value="note">Note</option>
          <option value="call">Call</option>
          <option value="email">Email</option>
        </Select>
      </FormField>
      <FormField label="Date and time" half error={errors.occurred_at?.message}>
        <input {...register("occurred_at")} type="datetime-local" />
      </FormField>
      <FormField label="Description" error={errors.description?.message}>
        <textarea {...register("description")} autoFocus />
      </FormField>
      {!activity && contactDeals && (
        <FormField label="Deal (optional)">
          <Select {...register("deal")}>
            <option value="">None</option>
            {contactDeals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </FormField>
      )}
      <FormField label="Follow-up date (optional)" half>
        <input {...register("follow_up_date")} type="date" />
      </FormField>
      {activity && followUp && (
        <label className="check-field">
          <input type="checkbox" {...register("done")} style={{ width: 18, height: 18 }} />
          Follow-up is done
        </label>
      )}
    </FormDialog>
  );
}
