import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { contact, mockFetch, org, renderWithApp, sentBody } from "../../test-utils";
import { DealForm } from "./DealForm";

const data = {
  organizations: [org(1, "Northwind"), org(2, "Brightwave")],
  contacts: [contact(10, "Ann North", 1), contact(11, "Bob North", 1), contact(20, "Cy Bright", 2)],
};

describe("DealForm", () => {
  it("shows required-field errors in plain words (R-Q-3)", async () => {
    const fetchMock = mockFetch();
    renderWithApp(<DealForm onClose={() => {}} />, data);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Value is required")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a value that isn't whole dollars", async () => {
    renderWithApp(<DealForm onClose={() => {}} />, data);
    await userEvent.type(screen.getByLabelText("Name"), "Big one");
    await userEvent.type(screen.getByLabelText("Value (USD)"), "12.5");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText(/Value must be a whole number/)).toBeInTheDocument();
  });

  it("rejects a probability above 100", async () => {
    renderWithApp(<DealForm onClose={() => {}} />, data);
    await userEvent.type(screen.getByLabelText("Name"), "x");
    await userEvent.type(screen.getByLabelText("Value (USD)"), "100");
    await userEvent.clear(screen.getByLabelText("Probability (%)"));
    await userEvent.type(screen.getByLabelText("Probability (%)"), "101");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText(/Probability must be a whole number from 0 to 100/)).toBeInTheDocument();
  });

  it("fills in the stage's usual probability when the stage changes (R-DATA-2)", async () => {
    renderWithApp(<DealForm onClose={() => {}} />, data);
    const probability = screen.getByLabelText("Probability (%)") as HTMLInputElement;
    expect(probability.value).toBe("10"); // New
    await userEvent.selectOptions(screen.getByLabelText("Stage"), "Proposal");
    expect(probability.value).toBe("50");
    await userEvent.selectOptions(screen.getByLabelText("Stage"), "Won");
    expect(probability.value).toBe("100");
  });

  it("sends the stage's probability when only the stage was chosen", async () => {
    const fetchMock = mockFetch({ id: 1 });
    renderWithApp(<DealForm onClose={() => {}} />, data);
    await userEvent.type(screen.getByLabelText("Name"), "Deal A");
    await userEvent.type(screen.getByLabelText("Value (USD)"), "$12,500");
    await userEvent.selectOptions(screen.getByLabelText("Stage"), "Negotiation");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sentBody(fetchMock)).toMatchObject({ name: "Deal A", stage: "Negotiation", probability: 75, value: 12500 });
  });

  it("keeps a probability that is set along with the stage (R-DATA-2)", async () => {
    const fetchMock = mockFetch({ id: 1 });
    renderWithApp(<DealForm onClose={() => {}} />, data);
    await userEvent.type(screen.getByLabelText("Name"), "Deal B");
    await userEvent.type(screen.getByLabelText("Value (USD)"), "500");
    await userEvent.selectOptions(screen.getByLabelText("Stage"), "Proposal");
    await userEvent.clear(screen.getByLabelText("Probability (%)"));
    await userEvent.type(screen.getByLabelText("Probability (%)"), "65");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sentBody(fetchMock)).toMatchObject({ stage: "Proposal", probability: 65 });
  });

  it("starts at the stage it was opened for", () => {
    renderWithApp(<DealForm stage="Qualified" onClose={() => {}} />, data);
    expect(screen.getByLabelText("Stage")).toHaveValue("Qualified");
    expect(screen.getByLabelText("Probability (%)")).toHaveValue("25");
  });

  it("offers only the chosen organization's contacts", async () => {
    renderWithApp(<DealForm onClose={() => {}} />, data);
    const names = () => Array.from((screen.getByLabelText("Contact") as HTMLSelectElement).options).map((o) => o.text);
    expect(names()).toEqual(["None", "Ann North", "Bob North", "Cy Bright"]);
    await userEvent.selectOptions(screen.getByLabelText("Organization"), "Northwind");
    expect(names()).toEqual(["None", "Ann North", "Bob North"]);
    await userEvent.selectOptions(screen.getByLabelText("Organization"), "Brightwave");
    expect(names()).toEqual(["None", "Cy Bright"]);
  });

  it("drops a chosen contact that doesn't belong to the new organization", async () => {
    renderWithApp(<DealForm organizationId={1} contactId={10} onClose={() => {}} />, data);
    expect(screen.getByLabelText("Contact")).toHaveValue("10");
    await userEvent.selectOptions(screen.getByLabelText("Organization"), "Brightwave");
    expect(screen.getByLabelText("Contact")).toHaveValue("");
  });
});
