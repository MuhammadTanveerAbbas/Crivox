import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsBar } from "./StatsBar";

describe("StatsBar", () => {
  it("renders verifiable product stats", () => {
    render(<StatsBar />);

    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Tone styles")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("Platforms")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("Languages")).toBeInTheDocument();
  });
});
