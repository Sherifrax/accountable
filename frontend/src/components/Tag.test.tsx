import { render, screen } from "@testing-library/react";
import { LateTag, OverdueTag, StatusTag } from "./Tag";

describe("Tag", () => {
  it("shows the Late tag only when late (R-PIPE-3)", () => {
    const { rerender } = render(<LateTag late={true} />);
    expect(screen.getByText("Late")).toBeInTheDocument();
    rerender(<LateTag late={false} />);
    expect(screen.queryByText("Late")).not.toBeInTheDocument();
  });

  it("shows Overdue only when overdue and not done (R-REC-4)", () => {
    const { rerender } = render(<OverdueTag overdue={true} />);
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    rerender(<OverdueTag overdue={true} done={true} />);
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
    rerender(<OverdueTag overdue={false} />);
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
  });

  it("names each contact status", () => {
    render(<><StatusTag status="lead" /><StatusTag status="qualified" /><StatusTag status="customer" /></>);
    expect(screen.getAllByText(/Lead|Qualified|Customer/)).toHaveLength(3);
  });
});
