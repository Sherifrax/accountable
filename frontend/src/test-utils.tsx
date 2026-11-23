import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { keys } from "./api/hooks";
import type { Contact, OrganizationRow, Stage } from "./api/types";

export const STAGES: Stage[] = [
  { name: "New", probability: 10, open: true },
  { name: "Qualified", probability: 25, open: true },
  { name: "Proposal", probability: 50, open: true },
  { name: "Negotiation", probability: 75, open: true },
  { name: "Won", probability: 100, open: false },
  { name: "Lost", probability: 0, open: false },
];

/** Renders with the data layer set up and its queries already filled, so nothing is fetched. */
export function renderWithApp(ui: ReactElement, data: { [key: string]: unknown } = {}, route = "/") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(keys.stages, STAGES);
  for (const [name, value] of Object.entries(data)) client.setQueryData([name], value);
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        <Toaster />
      </QueryClientProvider>,
    ),
  };
}

/** Replaces fetch with a recorder that answers every request with `body`. */
export function mockFetch(body: unknown = {}, status = 200) {
  const fn = vi.fn(async (_url: string, init?: { method?: string; body?: string }) => ({
    ok: status < 400,
    status,
    // Reads (refetches after a save) get an empty list; writes get the given body.
    json: async () => (init?.method && init.method !== "GET" ? body : []),
  }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

/** The JSON body of the (first, unless `call` is given) write the code under test sent. */
export const sentBody = (fn: ReturnType<typeof mockFetch>, call = 0) => {
  const writes = fn.mock.calls.filter(([, init]) => init?.body !== undefined);
  return JSON.parse(writes[call][1]!.body!);
};

export const org = (id: number, name: string): OrganizationRow => ({
  id,
  name,
  website: null,
  industry: null,
  notes: null,
  contact_count: 0,
  open_deal_count: 0,
  open_pipeline_value: 0,
});

export const contact = (
  id: number,
  name: string,
  organization_id: number | null,
  status: Contact["status"] = "lead",
): Contact => ({
  id,
  name,
  email: null,
  phone: null,
  job_title: null,
  organization_id,
  organization_name: null,
  status,
});
