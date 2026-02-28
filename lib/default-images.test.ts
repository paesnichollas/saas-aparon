import { describe, expect, it } from "vitest";

import {
  DEFAULT_SERVICE_FALLBACK_IMAGE_URL,
  getDefaultServiceImageUrl,
  normalizeServiceName,
  resolveServiceImageUrl,
} from "./default-images";

describe("default images", () => {
  it("normalizes names to support case and accent-insensitive matching", () => {
    expect(normalizeServiceName("  Hidrata\u00e7\u00e3o  ")).toBe("hidratacao");
    expect(normalizeServiceName("BARBA")).toBe("barba");
  });

  it("returns mapped image by service prefix", () => {
    expect(getDefaultServiceImageUrl("Barba navalha")).toBe(
      "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png",
    );
    expect(getDefaultServiceImageUrl("Corte tesoura")).toBe(
      "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png",
    );
    expect(getDefaultServiceImageUrl("Lavagem completa")).toBe(
      "https://utfs.io/f/8a457cda-f768-411d-a737-cdb23ca6b9b5-b3pegf.png",
    );
  });

  it("does not map partial words that are not prefixes", () => {
    expect(getDefaultServiceImageUrl("Cortesia premium")).toBe(
      DEFAULT_SERVICE_FALLBACK_IMAGE_URL,
    );
  });

  it("falls back to default service image when there is no name match", () => {
    expect(getDefaultServiceImageUrl("Pacote Premium")).toBe(
      DEFAULT_SERVICE_FALLBACK_IMAGE_URL,
    );
    expect(getDefaultServiceImageUrl("")).toBe(DEFAULT_SERVICE_FALLBACK_IMAGE_URL);
  });

  it("keeps explicit imageUrl and only applies fallback when image is empty", () => {
    expect(
      resolveServiceImageUrl(" https://example.com/service.png ", "Barba"),
    ).toBe("https://example.com/service.png");
    expect(resolveServiceImageUrl(null, "Barba navalha")).toBe(
      "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png",
    );
    expect(resolveServiceImageUrl("   ", "Serviço customizado")).toBe(
      DEFAULT_SERVICE_FALLBACK_IMAGE_URL,
    );
  });
});
