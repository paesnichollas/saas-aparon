import { describe, expect, it } from "vitest";

import {
  parseBarbershopIntentCookie,
  serializeBarbershopIntentCookie,
} from "@/lib/barbershop-context";

describe("barbershop-context", () => {
  it("parseBarbershopIntentCookie parses share_link payload", () => {
    const cookieValue = serializeBarbershopIntentCookie({
      entrySource: "share_link",
      barbershopId: "barbershop-1",
      shareSlug: "barber-a",
      shareToken: "token-123",
      timestamp: 1_000,
    });

    const parsedValue = parseBarbershopIntentCookie(cookieValue);

    expect(parsedValue).toEqual({
      entrySource: "share_link",
      barbershopId: "barbershop-1",
      shareSlug: "barber-a",
      shareToken: "token-123",
      timestamp: 1_000,
    });
  });

  it("parseBarbershopIntentCookie supports legacy payloads without entrySource", () => {
    const legacyPayload = encodeURIComponent(
      JSON.stringify({
        barbershopId: "barbershop-1",
        shareSlug: "barber-a",
        timestamp: 1_000,
      }),
    );

    const parsedValue = parseBarbershopIntentCookie(legacyPayload);

    expect(parsedValue).toEqual({
      entrySource: "unknown",
      barbershopId: "barbershop-1",
      shareSlug: "barber-a",
      shareToken: undefined,
      timestamp: 1_000,
    });
  });

  it("parseBarbershopIntentCookie returns null for malformed payload", () => {
    const parsedValue = parseBarbershopIntentCookie("invalid-json");

    expect(parsedValue).toBeNull();
  });
});
