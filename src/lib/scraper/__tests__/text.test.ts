import { describe, expect, it } from "vitest";
import {
  extractPriceFromText,
  extractSellerLinks,
  extractTags,
  extractUrls,
  inferBrandFromText,
  inferBrandFromUrls,
  inferTypeFromText,
} from "../text";

describe("text helpers", () => {
  it("extracts urls and normalizes punctuation", () => {
    const text = "Check https://example.com/item, and https://foo.bar/test.";
    expect(extractUrls(text)).toEqual([
      "https://example.com/item",
      "https://foo.bar/test",
    ]);
  });

  it("extracts seller links and filters reddit hosts", () => {
    const urls = extractSellerLinks([
      "https://reddit.com/r/test",
      "https://taobao.com/item",
      "https://weidian.com/item",
    ]);
    expect(urls).toEqual([
      "https://taobao.com/item",
      "https://weidian.com/item",
    ]);
  });

  it("infers brand from url or text", () => {
    expect(inferBrandFromUrls(["https://example.com/nike/item"]))
      .toBe("Nike");
    expect(inferBrandFromText("Selling Stone Island hoodie"))
      .toBe("Stone Island");
  });

  it("infers type from text", () => {
    expect(inferTypeFromText("cozy hoodie size L")).toBe("Hoodie");
  });

  it("extracts price from text", () => {
    expect(extractPriceFromText("Price $120 shipped"))
      .toEqual({ value: 120, currency: "USD" });
    expect(extractPriceFromText("CNY 450"))
      .toEqual({ value: 450, currency: "CNY" });
  });

  it("extracts tags from text and flair", () => {
    expect(extractTags("QC check", "W2C")).toEqual(["QC", "W2C"]);
  });
});
