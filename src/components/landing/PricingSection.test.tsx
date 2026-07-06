import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PricingSection } from "./PricingSection";

describe("PricingSection", () => {
  it("shows Pro as coming soon and keeps Free actionable", () => {
    render(
      <MemoryRouter>
        <PricingSection />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Coming Soon").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: /^get started$/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /^coming soon$/i })).toBeDisabled();
  });
});
