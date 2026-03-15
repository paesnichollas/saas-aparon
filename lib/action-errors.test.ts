import { describe, expect, it } from "vitest";

import {
  getActionErrorMessage,
  getActionErrorMessageFromError,
  getServerErrorMessage,
  getValidationErrorMessage,
  getValidationErrorMessageWithNested,
} from "./action-errors";

describe("action-errors", () => {
  describe("getValidationErrorMessage", () => {
    it("returns first root error when present", () => {
      const errors = { _errors: ["Campo inválido."] };
      expect(getValidationErrorMessage(errors)).toBe("Campo inválido.");
    });

    it("returns null when no root errors", () => {
      expect(getValidationErrorMessage(null)).toBeNull();
      expect(getValidationErrorMessage({})).toBeNull();
      expect(getValidationErrorMessage({ _errors: [] })).toBeNull();
    });

    it("returns null when first error is not string", () => {
      expect(getValidationErrorMessage({ _errors: [123] })).toBeNull();
    });
  });

  describe("getValidationErrorMessageWithNested", () => {
    it("returns first nested error", () => {
      const errors = {
        name: { _errors: ["Nome inválido."] },
      };
      expect(getValidationErrorMessageWithNested(errors)).toBe("Nome inválido.");
    });

    it("returns root error when present", () => {
      const errors = { _errors: ["Erro geral."] };
      expect(getValidationErrorMessageWithNested(errors)).toBe("Erro geral.");
    });
  });

  describe("getServerErrorMessage", () => {
    it("returns trimmed string when valid", () => {
      expect(getServerErrorMessage("  Erro interno.  ")).toBe("Erro interno.");
    });

    it("returns null for empty or invalid", () => {
      expect(getServerErrorMessage("")).toBeNull();
      expect(getServerErrorMessage("   ")).toBeNull();
      expect(getServerErrorMessage(123)).toBeNull();
    });
  });

  describe("getActionErrorMessage", () => {
    it("returns validation message when present", () => {
      const result = {
        validationErrors: { _errors: ["Validação falhou."] },
        serverError: "Server error",
      };
      expect(
        getActionErrorMessage(result.validationErrors, result.serverError, "Fallback"),
      ).toBe("Validação falhou.");
    });

    it("returns fallback when serverError present but no validation", () => {
      expect(
        getActionErrorMessage(null, "server error", "Fallback"),
      ).toBe("Fallback");
    });

    it("returns null when no errors", () => {
      expect(getActionErrorMessage(null, null, "Fallback")).toBeNull();
    });
  });

  describe("getActionErrorMessageFromError", () => {
    it("returns error message when Error with message", () => {
      expect(
        getActionErrorMessageFromError(new Error("Algo deu errado."), "Fallback"),
      ).toBe("Algo deu errado.");
    });

    it("returns fallback for empty message", () => {
      expect(
        getActionErrorMessageFromError(new Error("   "), "Fallback"),
      ).toBe("Fallback");
    });

    it("returns fallback for non-Error", () => {
      expect(getActionErrorMessageFromError("string", "Fallback")).toBe("Fallback");
    });
  });
});
