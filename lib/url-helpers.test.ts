import { describe, expect, it } from "vitest";

import { isValidImageUrl } from "./url-helpers";

describe("url-helpers", () => {
  describe("isValidImageUrl", () => {
    it("returns true for relative paths", () => {
      expect(isValidImageUrl("/images/logo.png")).toBe(true);
      expect(isValidImageUrl("/")).toBe(true);
    });

    it("returns true for http and https URLs", () => {
      expect(isValidImageUrl("https://example.com/image.png")).toBe(true);
      expect(isValidImageUrl("http://example.com/image.png")).toBe(true);
    });

    it("returns false for invalid URLs", () => {
      expect(isValidImageUrl("ftp://example.com/image.png")).toBe(false);
      expect(isValidImageUrl("javascript:alert(1)")).toBe(false);
      expect(isValidImageUrl("not-a-url")).toBe(false);
    });
  });
});
