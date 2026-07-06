import { describe, expect, it } from "vitest";
import { queueItemSchema, resetEmailSchema, templateSchema } from "./schemas";

describe("resetEmailSchema", () => {
  it("accepts valid email", () => {
    expect(resetEmailSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = resetEmailSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("templateSchema", () => {
  it("requires title, content, and category", () => {
    expect(templateSchema.safeParse({ title: "", content: "x", category: "General" }).success).toBe(false);
    expect(templateSchema.safeParse({ title: "T", content: "", category: "General" }).success).toBe(false);
    expect(
      templateSchema.safeParse({ title: "T", content: "Body", category: "General" }).success,
    ).toBe(true);
  });
});

describe("queueItemSchema", () => {
  it("requires comment text and platform", () => {
    expect(queueItemSchema.safeParse({ comment_text: "", platform: "LinkedIn" }).success).toBe(false);
    expect(
      queueItemSchema.safeParse({ comment_text: "Nice post!", platform: "LinkedIn" }).success,
    ).toBe(true);
  });
});
