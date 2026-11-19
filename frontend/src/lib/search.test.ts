import { searchRows } from "./search";

const rows = [
  { name: "Northwind Logistics", industry: "Logistics", people: 4 },
  { name: "Brightwave Energy", industry: "Energy", people: 12 },
  { name: "Harbor & Pine", industry: null, people: 0 },
];
const text = (r: (typeof rows)[number]) => [r.name, r.industry, r.people];

describe("searchRows", () => {
  it("matches any visible column", () => {
    expect(searchRows(rows, "energy", text).map((r) => r.name)).toEqual(["Brightwave Energy"]);
    expect(searchRows(rows, "12", text).map((r) => r.name)).toEqual(["Brightwave Energy"]);
  });
  it("ignores case", () => {
    expect(searchRows(rows, "NORTHWIND", text)).toHaveLength(1);
  });
  it("returns everything for an empty query and tolerates nulls", () => {
    expect(searchRows(rows, "  ", text)).toHaveLength(3);
    expect(searchRows(rows, "null", text)).toHaveLength(0);
  });
  it("matches part of a word", () => {
    expect(searchRows(rows, "wave", text)).toHaveLength(1);
  });
});
