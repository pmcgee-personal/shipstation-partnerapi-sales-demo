// src/utils/demoUtils.test.js
import { describe, it, expect } from "vitest";
import { generateDemoDetails } from "./demoUtils";

describe("generateDemoDetails Utility", () => {
  it("should generate an object containing both a label and an email", () => {
    const details = generateDemoDetails();

    expect(details).toHaveProperty("label");
    expect(details).toHaveProperty("email");
  });

  it("should generate a realistic non-empty company name", () => {
    const { label } = generateDemoDetails();

    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
    // Ensure the label contains two words (Adjective + Noun)
    expect(label.split(" ").length).toBe(2);
  });

  it("should generate a valid formatted demo email address", () => {
    const { email } = generateDemoDetails();

    expect(typeof email).toBe("string");
    // Ensure it follows our structure: demo-companyname-timestamp@example.com
    expect(email).toContain("@example.com");
    expect(email.startsWith("demo-")).toBe(true);
  });
});
