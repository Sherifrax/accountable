import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type Column } from "./DataTable";

type Row = { id: number; name: string; value: number; city: string | null };
const data: Row[] = [
  { id: 1, name: "Charlie", value: 300, city: "Oslo" },
  { id: 2, name: "alpha", value: 100, city: null },
  { id: 3, name: "Bravo", value: 200, city: "Lima" },
];
const columns: Column<Row>[] = [
  { accessorKey: "name", header: "Name", meta: { strong: true } },
  { accessorKey: "value", header: "Value", meta: { align: "num" } },
  { accessorKey: "city", header: "City" },
];

function setup(rows = data) {
  return render(
    <DataTable
      noun="people"
      searchPlaceholder="Search people"
      data={rows}
      columns={columns}
      visibleText={(r) => [r.name, r.value, r.city]}
      defaultSort={{ id: "name" }}
      rowKey={(r) => r.id}
    />,
  );
}

const names = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent);

describe("DataTable", () => {
  it("starts on the default sort, ignoring case (R-TBL-6)", () => {
    setup();
    expect(names()).toEqual(["alpha", "Bravo", "Charlie"]);
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "ascending");
  });

  it("sorts by a heading, reverses on the second click, and shows the arrow (R-TBL-2)", async () => {
    setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Value" }));
    expect(names()).toEqual(["alpha", "Bravo", "Charlie"]); // 100, 200, 300 ascending
    expect(screen.getByRole("columnheader", { name: "Value" })).toHaveAttribute("aria-sort", "ascending");
    await user.click(screen.getByRole("button", { name: "Value" }));
    expect(names()).toEqual(["Charlie", "Bravo", "alpha"]);
    expect(screen.getByRole("columnheader", { name: "Value" })).toHaveAttribute("aria-sort", "descending");
    await user.click(screen.getByRole("button", { name: "Value" }));
    expect(screen.getByRole("columnheader", { name: "Value" })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "none");
  });

  it("puts empty values last either way", async () => {
    setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "City" }));
    expect(names()).toEqual(["Bravo", "Charlie", "alpha"]);
    await user.click(screen.getByRole("button", { name: "City" }));
    expect(names()).toEqual(["Charlie", "Bravo", "alpha"]);
  });

  it("searches as you type, ignoring case (R-TBL-1)", async () => {
    setup();
    await userEvent.type(screen.getByRole("searchbox", { name: "Search people" }), "BRA");
    expect(names()).toEqual(["Bravo"]);
    expect(screen.getByText("1 of 3 people")).toBeInTheDocument();
  });

  it("names the search when nothing matches (R-TBL-5)", async () => {
    setup();
    await userEvent.type(screen.getByRole("searchbox"), "acme");
    expect(screen.getByText("No people match 'acme'.")).toBeInTheDocument();
  });

  it("says so when there is no data at all (R-TBL-5)", () => {
    setup([]);
    expect(screen.getByText("No people yet.")).toBeInTheDocument();
  });
});
