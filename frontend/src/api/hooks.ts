import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "./client";
import type {
  Activity,
  ActivityInput,
  Contact,
  ContactDetail,
  ContactImpact,
  ContactInput,
  ContactStatus,
  Dashboard,
  Deal,
  DealDetail,
  DealImpact,
  DealInput,
  Organization,
  OrganizationDetail,
  OrganizationImpact,
  OrganizationInput,
  OrganizationRow,
  Stage,
} from "./types";

// Query keys. Every record query starts with its kind, so one prefix reaches them all.
export const keys = {
  stages: ["stages"] as const,
  organizations: ["organizations"] as const,
  organization: (id: number) => ["organizations", id] as const,
  contacts: ["contacts"] as const,
  contact: (id: number) => ["contacts", id] as const,
  deals: ["deals"] as const,
  deal: (id: number) => ["deals", id] as const,
  dashboard: ["dashboard"] as const,
  impact: (kind: string, id: number) => ["impact", kind, id] as const,
};

/**
 * The invalidation map (spec 3.4). Records are linked everywhere: a deal change reaches its
 * organization, its contact, the board and the dashboard; an activity reaches timelines and the
 * dashboard. The lists are small, so each change refreshes all four families rather than
 * guessing, and only the queries on screen are fetched again.
 */
export function invalidateRecords(qc: QueryClient) {
  return Promise.all(
    [keys.organizations, keys.contacts, keys.deals, keys.dashboard].map((queryKey) =>
      qc.invalidateQueries({ queryKey }),
    ),
  );
}

export const messageOf = (error: unknown) =>
  error instanceof ApiError ? error.message : "Something went wrong. Try again.";

// ---- reads ----

export const useStages = () =>
  useQuery({ queryKey: keys.stages, queryFn: () => api<Stage[]>("/stages"), staleTime: Infinity });
export const useOrganizations = () =>
  useQuery({ queryKey: keys.organizations, queryFn: () => api<OrganizationRow[]>("/organizations") });
export const useOrganization = (id: number) =>
  useQuery({ queryKey: keys.organization(id), queryFn: () => api<OrganizationDetail>(`/organizations/${id}`) });
export const useContacts = () =>
  useQuery({ queryKey: keys.contacts, queryFn: () => api<Contact[]>("/contacts") });
export const useContact = (id: number) =>
  useQuery({ queryKey: keys.contact(id), queryFn: () => api<ContactDetail>(`/contacts/${id}`) });
export const useDeals = () => useQuery({ queryKey: keys.deals, queryFn: () => api<Deal[]>("/deals") });
export const useDeal = (id: number) =>
  useQuery({ queryKey: keys.deal(id), queryFn: () => api<DealDetail>(`/deals/${id}`) });
export const useDashboard = () =>
  useQuery({ queryKey: keys.dashboard, queryFn: () => api<Dashboard>("/dashboard") });

export type ImpactKind = "organizations" | "contacts" | "deals";
type ImpactOf = { organizations: OrganizationImpact; contacts: ContactImpact; deals: DealImpact };
export function useDeleteImpact<K extends ImpactKind>(kind: K, id: number | null) {
  return useQuery({
    queryKey: keys.impact(kind, id ?? 0),
    queryFn: () => api<ImpactOf[K]>(`/${kind}/${id}/delete-impact`),
    enabled: id !== null,
    gcTime: 0,
  });
}

// ---- writes ----

function useWrite<TVars, TResult>(run: (vars: TVars) => Promise<TResult>, success?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: async () => {
      await invalidateRecords(qc);
      if (success) toast.success(success);
    },
    onError: (error) => toast.error(messageOf(error)),
  });
}

export const useSaveOrganization = () =>
  useWrite(
    ({ id, input }: { id?: number; input: Partial<OrganizationInput> }) =>
      id ? api<Organization>(`/organizations/${id}`, { method: "PATCH", body: input }) : api<Organization>("/organizations", { method: "POST", body: input }),
    "Organization saved",
  );
export const useSaveContact = () =>
  useWrite(
    ({ id, input }: { id?: number; input: Partial<ContactInput> }) =>
      id ? api<Contact>(`/contacts/${id}`, { method: "PATCH", body: input }) : api<Contact>("/contacts", { method: "POST", body: input }),
    "Contact saved",
  );
export const useSaveDeal = () =>
  useWrite(
    ({ id, input }: { id?: number; input: Partial<DealInput> }) =>
      id ? api<Deal>(`/deals/${id}`, { method: "PATCH", body: input }) : api<Deal>("/deals", { method: "POST", body: input }),
    "Deal saved",
  );
const SINGULAR = { organizations: "Organization", contacts: "Contact", deals: "Deal" } as const;
export const useDeleteRecord = (kind: ImpactKind) =>
  useWrite((id: number) => api<void>(`/${kind}/${id}`, { method: "DELETE" }), `${SINGULAR[kind]} deleted`);

export const useCreateActivity = () =>
  useWrite((input: ActivityInput) => api<Activity>("/activities", { method: "POST", body: input }), "Activity logged");
export const useUpdateActivity = (message?: string) =>
  useWrite(
    ({ id, input }: { id: number; input: Partial<Activity> & { follow_up_date?: string | null } }) =>
      api<Activity>(`/activities/${id}`, { method: "PATCH", body: input }),
    message,
  );
export const useDeleteActivity = () =>
  useWrite((id: number) => api<void>(`/activities/${id}`, { method: "DELETE" }), "Activity deleted");

export type { ContactStatus };
