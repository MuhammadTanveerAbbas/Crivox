import { describe, expect, it } from "vitest";
import { sanitizeModelOutput, sanitizeUserInput } from "./sanitize";

describe("sanitizeUserInput", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizeUserInput("")).toBe("");
  });

  it("strips script tags", () => {
    const input = 'Hello<script>alert("x")</script> world';
    expect(sanitizeUserInput(input)).toBe("Hello world");
  });

  it("preserves normal text and trims whitespace", () => {
    expect(sanitizeUserInput("  Great post!  ")).toBe("Great post!");
  });

  it("truncates input beyond max length", () => {
    const long = "a".repeat(60_000);
    expect(sanitizeUserInput(long).length).toBeLessThanOrEqual(50_000);
  });
});

describe("sanitizeModelOutput", () => {
  it("strips HTML tags from model output", () => {
    expect(sanitizeModelOutput("<b>Bold</b> comment")).toBe("Bold comment");
  });

  it("returns empty string for empty output", () => {
    expect(sanitizeModelOutput("")).toBe("");
  });
});
