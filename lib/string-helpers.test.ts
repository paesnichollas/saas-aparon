import { describe, expect, it } from "vitest";

import {
  normalizeForMessageMatch,
  normalizeOptionalText,
  normalizePhones,
} from "./string-helpers";

describe("string-helpers", () => {
  describe("normalizeOptionalText", () => {
    it("returns trimmed non-empty string as-is (as value or null)", () => {
      expect(normalizeOptionalText("  hello  ")).toBe("hello");
      expect(normalizeOptionalText("x")).toBe("x");
    });

    it("returns null for empty or whitespace", () => {
      expect(normalizeOptionalText("")).toBeNull();
      expect(normalizeOptionalText("   ")).toBeNull();
      expect(normalizeOptionalText(null)).toBeNull();
      expect(normalizeOptionalText(undefined)).toBeNull();
    });
  });

  describe("normalizeForMessageMatch", () => {
    it("normalizes NFD and removes diacritics", () => {
      expect(normalizeForMessageMatch("Não")).toBe("nao");
      expect(normalizeForMessageMatch("Ação")).toBe("acao");
    });

    it("converts to lowercase", () => {
      expect(normalizeForMessageMatch("LOGIN")).toBe("login");
    });
  });

  describe("normalizePhones", () => {
    it("trims and filters empty", () => {
      expect(normalizePhones([" 11999 ", "  ", "21888"])).toEqual([
        "11999",
        "21888",
      ]);
    });

    it("returns undefined when phones is undefined", () => {
      expect(normalizePhones(undefined)).toBeUndefined();
    });

    it("returns fallback when phones undefined and fallbackWhenMissing", () => {
      expect(
        normalizePhones(undefined, { fallbackWhenMissing: ["11999"] }),
      ).toEqual(["11999"]);
    });

    it("returns null when empty and allowEmpty false", () => {
      expect(normalizePhones([])).toBeNull();
      expect(normalizePhones(["  ", ""])).toBeNull();
    });

    it("returns empty array when empty and allowEmpty true", () => {
      expect(normalizePhones([], { allowEmpty: true })).toEqual([]);
    });
  });
});
