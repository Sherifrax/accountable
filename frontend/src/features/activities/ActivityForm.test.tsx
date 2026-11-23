import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format } from "date-fns";
import type { Deal } from "../../api/types";
import { mockFetch, renderWithApp, sentBody } from "../../test-utils";
import { ActivityForm } from "./ActivityForm";

const deal = (id: number, name: string) => ({ id, name }) as Deal;

describe("ActivityForm", () => {
  it("defaults the date and time to now (R-ACT-1)", () => {
    renderWithApp(<ActivityForm contactId={1} onClose={() => {}} />);
    const value = (screen.getByLabelText("Date and time") as HTMLInputElement).value;
    expect(value.slice(0, 10)).toBe(format(new Date(), "yyyy-MM-dd"));
  });

  it("needs a description", async () => {
    const fetchMock = mockFetch();
    renderWithApp(<ActivityForm contactId={1} onClose={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Description is required")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("makes the follow-up date optional (R-ACT-1)", async () => {
    const fetchMock = mockFetch({ id: 1 });
    renderWithApp(<ActivityForm contactId={1} onClose={() => {}} />);
    await userEvent.type(screen.getByLabelText("Description"), "Spoke about pricing");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sentBody(fetchMock)).toMatchObject({
      type: "note",
      description: "Spoke about pricing",
      follow_up_date: null,
      contact_id: 1,
    });
  });

  it("sends a follow-up date when given", async () => {
    const fetchMock = mockFetch({ id: 1 });
    renderWithApp(<ActivityForm dealId={7} onClose={() => {}} />);
    await userEvent.selectOptions(screen.getByLabelText("Type"), "call");
    await userEvent.type(screen.getByLabelText("Description"), "Call back");
    await userEvent.type(screen.getByLabelText("Follow-up date (optional)"), "2026-12-01");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sentBody(fetchMock)).toMatchObject({ type: "call", follow_up_date: "2026-12-01", deal_id: 7 });
  });

  it("from a contact, lists only that contact's deals (R-ACT-1)", () => {
    renderWithApp(
      <ActivityForm contactId={1} contactDeals={[deal(5, "Deal five"), deal(6, "Deal six")]} onClose={() => {}} />,
    );
    const options = Array.from((screen.getByLabelText("Deal (optional)") as HTMLSelectElement).options).map(
      (o) => o.text,
    );
    expect(options).toEqual(["None", "Deal five", "Deal six"]);
  });

  it("from a deal, has no deal picker", () => {
    renderWithApp(<ActivityForm dealId={5} onClose={() => {}} />);
    expect(screen.queryByLabelText("Deal (optional)")).not.toBeInTheDocument();
  });

  it("links the chosen deal", async () => {
    const fetchMock = mockFetch({ id: 1 });
    renderWithApp(<ActivityForm contactId={1} contactDeals={[deal(5, "Deal five")]} onClose={() => {}} />);
    await userEvent.type(screen.getByLabelText("Description"), "Intro");
    await userEvent.selectOptions(screen.getByLabelText("Deal (optional)"), "Deal five");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sentBody(fetchMock)).toMatchObject({ contact_id: 1, deal_id: 5 });
  });
});
