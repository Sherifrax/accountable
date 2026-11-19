import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDelete, deleteMessage } from "./ConfirmDelete";

describe("deleteMessage (R-DEL-4)", () => {
  it("organization, with counts", () => {
    expect(deleteMessage({ kind: "organization", impact: { name: "Northwind Logistics", contacts: 4, deals: 3 } })).toBe(
      "Delete Northwind Logistics? Its 4 contacts and 3 deals will be kept, with no organization. This can't be undone.",
    );
  });
  it("organization, singular and partial", () => {
    expect(deleteMessage({ kind: "organization", impact: { name: "A", contacts: 1, deals: 0 } })).toBe(
      "Delete A? Its 1 contact will be kept, with no organization. This can't be undone.",
    );
    expect(deleteMessage({ kind: "organization", impact: { name: "A", contacts: 0, deals: 1 } })).toContain("Its 1 deal will");
    expect(deleteMessage({ kind: "organization", impact: { name: "A", contacts: 0, deals: 0 } })).toBe(
      "Delete A? It has no contacts or deals. This can't be undone.",
    );
  });
  it("contact", () => {
    expect(
      deleteMessage({ kind: "contact", impact: { name: "Maya Okafor", deals: 2, activities_deleted: 3, activities_kept: 1 } }),
    ).toBe(
      "Delete Maya Okafor? Their 2 deals will be kept, with no contact. 3 activities linked only to them will be deleted. 1 activity also linked to a deal will be kept, with no contact. This can't be undone.",
    );
    expect(deleteMessage({ kind: "contact", impact: { name: "X", deals: 0, activities_deleted: 0, activities_kept: 0 } })).toBe(
      "Delete X? They have no deals or activities. This can't be undone.",
    );
  });
  it("deal", () => {
    expect(
      deleteMessage({ kind: "deal", impact: { name: "Fleet tracking", stage_changes: 2, activities_deleted: 1, activities_kept: 4 } }),
    ).toBe(
      "Delete Fleet tracking? Its 2 stage changes and 1 activity will be deleted. 4 activities also linked to a contact will be kept, with no deal. This can't be undone.",
    );
    expect(deleteMessage({ kind: "deal", impact: { name: "D", stage_changes: 0, activities_deleted: 0, activities_kept: 0 } })).toBe(
      "Delete D? It has no activities. This can't be undone.",
    );
  });
});

describe("ConfirmDelete dialog", () => {
  const target = { kind: "organization", impact: { name: "Acme", contacts: 2, deals: 1 } } as const;

  it("shows the message and a danger button named for the action", () => {
    render(<ConfirmDelete target={target} onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole("dialog")).toHaveTextContent("Delete Acme? Its 2 contacts and 1 deal will be kept");
    expect(screen.getByRole("button", { name: "Delete organization" })).toBeInTheDocument();
  });

  it("closes with Escape (R-Q-5)", async () => {
    const onCancel = vi.fn();
    render(<ConfirmDelete target={target} onCancel={onCancel} onConfirm={() => {}} />);
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalled();
  });

  it("keeps focus inside the dialog (R-Q-5)", async () => {
    render(<ConfirmDelete target={target} onCancel={() => {}} onConfirm={() => {}} />);
    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 6; i++) {
      await userEvent.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("confirms", async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDelete target={target} onCancel={() => {}} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole("button", { name: "Delete organization" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
