import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the Freedom Express wash menu", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /choose your wash/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /single wash packages/i })).toBeInTheDocument();
  expect(screen.getByText("The Works")).toBeInTheDocument();
});
