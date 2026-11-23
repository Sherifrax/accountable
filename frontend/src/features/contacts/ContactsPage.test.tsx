import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { contact, renderWithApp } from "../../test-utils";
import { ContactsPage } from "./ContactsPage";

const contacts = [
  contact(1, "Ann", null, "lead"),
  contact(2, "Bob", null, "lead"),
  contact(3, "Cy", null, "qualified"),
  contact(4, "Di", null, "customer"),
  contact(5, "Ed", null, "customer"),
  contact(6, "Flo", null, "customer"),
];
const names = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((r) => within(r).getAllByRole("cell")[0].textContent);

describe("ContactsPage", () => {
  it("shows a count on each status pill (R-TBL-4)", () => {
    renderWithApp(<ContactsPage />, { contacts });
    const group = screen.getByRole("group", { name: "Filter by status" });
    expect(within(group).getByRole("button", { name: /All/ })).toHaveTextContent("All 6");
    expect(within(group).getByRole("button", { name: /Lead/ })).toHaveTextContent("Lead 2");
    expect(within(group).getByRole("button", { name: /Qualified/ })).toHaveTextContent("Qualified 1");
    expect(within(group).getByRole("button", { name: /Customer/ })).toHaveTextContent("Customer 3");
  });

  it("filters the table by status and back", async () => {
    renderWithApp(<ContactsPage />, { contacts });
    expect(names()).toHaveLength(6);
    await userEvent.click(screen.getByRole("button", { name: /Customer/ }));
    expect(names()).toEqual(["Di", "Ed", "Flo"]);
    expect(screen.getByRole("button", { name: /Customer/ })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: /Lead/ }));
    expect(names()).toEqual(["Ann", "Bob"]);
    await userEvent.click(screen.getByRole("button", { name: /All/ }));
    expect(names()).toHaveLength(6);
  });

  it("keeps the counts when a filter or search is on", async () => {
    renderWithApp(<ContactsPage />, { contacts });
    await userEvent.click(screen.getByRole("button", { name: /Lead/ }));
    expect(screen.getByRole("button", { name: /Customer/ })).toHaveTextContent("Customer 3");
  });

  it("searches within the chosen status", async () => {
    renderWithApp(<ContactsPage />, { contacts });
    await userEvent.click(screen.getByRole("button", { name: /Customer/ }));
    await userEvent.type(screen.getByRole("searchbox"), "fl");
    expect(names()).toEqual(["Flo"]);
  });
});
