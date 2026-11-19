import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("shows the stage names from the API", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: async () => [
        { name: "New", probability: 10, open: true },
        { name: "Won", probability: 100, open: false },
      ],
    }),
  );
  render(<App />);
  expect(await screen.findByText("Won")).toBeInTheDocument();
  expect(screen.getByText("New")).toBeInTheDocument();
});
