import { describe, expect, it } from "vitest";
import { deriveItemName, isGenericItemName } from "@/lib/item-name";

describe("item name helpers", () => {
  it("cleans haul noise from titles", () => {
    expect(deriveItemName("[HAUL] 6.5kg Nike Tech W2C")).toBe("Nike Tech");
  });

  it("flags generic haul-style names", () => {
    expect(isGenericItemName("First Ever")).toBe(true);
    expect(isGenericItemName("Mulebuy to EU streetwear")).toBe(true);
  });

  it("keeps specific product names", () => {
    expect(isGenericItemName("Arc'teryx Beta LT Jacket")).toBe(false);
  });
});
