import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PricingSection } from "./PricingSection";

describe("PricingSection", () => {
  it("shows both plans as actionable with Pro no longer 'Coming Soon'", () => {
    render(
      <MemoryRouter>
        <PricingSection />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /^get started$/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /^subscribe$/i })).not.toBeDisabled();
  });
});
