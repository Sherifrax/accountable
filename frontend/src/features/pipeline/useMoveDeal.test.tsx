import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { keys } from "../../api/hooks";
import type { Deal } from "../../api/types";
import { todayIso } from "../../lib/format";
import { STAGES } from "../../test-utils";
import { applyMove, columnOf, openDeals, totals } from "./moveDeal";
import { useMoveDeal } from "./useMoveDeal";

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...args: unknown[]) => toastError(...args), success: vi.fn() } }));

const deal = (id: number, stage: string, position: number, value: number, probability: number, extra: Partial<Deal> = {}): Deal => ({
  id, name: `Deal ${id}`, organization_id: null, organization_name: null, contact_id: null, contact_name: null,
  stage, value, probability, expected_revenue: (value * probability) / 100, close_date: "2099-01-01", late: false,
  position, created_at: "", updated_at: "", ...extra,
});

// New: 1, 2, 3.  Proposal: 4.  Won: 5.
const start = () => [
  deal(1, "New", 0, 1000, 10),
  deal(2, "New", 1, 2000, 10),
  deal(3, "New", 2, 3000, 10),
  deal(4, "Proposal", 0, 4000, 50),
  deal(5, "Won", 0, 5000, 100),
];
const ids = (deals: Deal[], stage: string) => columnOf(deals, stage).map((d) => d.id);

describe("applyMove", () => {
  it("moves between columns, resets probability, and renumbers both columns", () => {
    const after = applyMove(start(), { id: 2, stage: "Proposal", index: 0 }, STAGES, "2026-06-15");
    expect(ids(after, "Proposal")).toEqual([2, 4]);
    expect(ids(after, "New")).toEqual([1, 3]);
    expect(columnOf(after, "New").map((d) => d.position)).toEqual([0, 1]);
    const moved = after.find((d) => d.id === 2)!;
    expect(moved.probability).toBe(50);
    expect(moved.expected_revenue).toBe(1000);
  });

  it("moves within a column", () => {
    expect(ids(applyMove(start(), { id: 1, stage: "New", index: 2 }, STAGES, "2026-06-15"), "New")).toEqual([2, 3, 1]);
    expect(ids(applyMove(start(), { id: 3, stage: "New", index: 0 }, STAGES, "2026-06-15"), "New")).toEqual([3, 1, 2]);
  });

  it("sets the close date to today on Won and Lost", () => {
    const after = applyMove(start(), { id: 1, stage: "Lost", index: 0 }, STAGES, "2026-06-15");
    expect(after.find((d) => d.id === 1)).toMatchObject({ close_date: "2026-06-15", probability: 0, late: false });
  });

  it("clears the late flag when a late deal is won, and sets it when an old won deal reopens", () => {
    const late = [deal(1, "New", 0, 100, 10, { close_date: "2020-01-01", late: true })];
    expect(applyMove(late, { id: 1, stage: "Won", index: 0 }, STAGES, "2026-06-15")[0].late).toBe(false);
    const won = [deal(1, "Won", 0, 100, 100, { close_date: "2020-01-01" })];
    expect(applyMove(won, { id: 1, stage: "New", index: 0 }, STAGES, "2026-06-15")[0].late).toBe(true);
  });

  it("puts an index past the end last", () => {
    expect(ids(applyMove(start(), { id: 1, stage: "Proposal", index: 99 }, STAGES, "2026-06-15"), "Proposal")).toEqual([4, 1]);
  });
});

describe("totals", () => {
  it("changes for the columns and the board when a card moves", () => {
    const before = start();
    const after = applyMove(before, { id: 3, stage: "Won", index: 0 }, STAGES, "2026-06-15");
    expect(totals(columnOf(before, "New"))).toMatchObject({ count: 3, value: 6000, expected: 600 });
    expect(totals(columnOf(after, "New"))).toMatchObject({ count: 2, value: 3000, expected: 300 });
    expect(totals(columnOf(after, "Won"))).toMatchObject({ count: 2, value: 8000, expected: 8000 });
    // The board's two figures count open deals only.
    expect(totals(openDeals(before))).toMatchObject({ value: 10000, expected: 600 + 2000 });
    expect(totals(openDeals(after))).toMatchObject({ value: 7000, expected: 300 + 2000 });
  });
});

describe("useMoveDeal (R-PIPE-5)", () => {
  function setup() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
    client.setQueryData(keys.stages, STAGES);
    client.setQueryData(keys.deals, start());
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    return { client, ...renderHook(() => useMoveDeal(), { wrapper }) };
  }
  const cached = (client: QueryClient) => client.getQueryData<Deal[]>(keys.deals)!;

  beforeEach(() => toastError.mockClear());

  it("moves the card and changes the totals before the server replies", async () => {
    let reply: (value: unknown) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise((resolve) => (reply = resolve))));
    const { client, result } = setup();
    act(() => result.current.mutate({ id: 1, stage: "Proposal", index: 0 }));
    await waitFor(() => expect(ids(cached(client), "Proposal")).toEqual([1, 4]));
    expect(totals(columnOf(cached(client), "New")).value).toBe(5000);
    expect(totals(columnOf(cached(client), "Proposal")).value).toBe(5000);
    expect(cached(client).find((d) => d.id === 1)!.probability).toBe(50);
    expect(todayIso()).toBeTruthy();
    // The request is still waiting; nothing has been confirmed yet.
    expect(result.current.isPending).toBe(true);
    reply({ ok: true, status: 200, json: async () => ({}) });
  });

  it("puts the card back and shows a message when the server refuses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({ detail: "Nope" }) })));
    const { client, result } = setup();
    act(() => result.current.mutate({ id: 1, stage: "Won", index: 0 }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Couldn't save the move. Try again."));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(ids(cached(client), "New")).toEqual([1, 2, 3]);
    expect(cached(client).find((d) => d.id === 1)!.stage).toBe("New");
  });

  it("puts the card back when the server can't be reached", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    const { client, result } = setup();
    act(() => result.current.mutate({ id: 2, stage: "Lost", index: 0 }));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(cached(client).find((d) => d.id === 2)!.stage).toBe("New");
  });
});
