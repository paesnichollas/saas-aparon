import { describe, expect, it } from "vitest";

import {
  getReviewEligibility,
  refreshBarbershopRatingSummary,
  type ReviewSummaryTransaction,
} from "./review";

const now = new Date("2026-02-26T12:00:00.000Z");

const baseEligibilityInput = {
  actorUserId: "user-1",
  bookingUserId: "user-1",
  cancelledAt: null,
  paymentStatus: "PAID" as const,
  hasReview: false,
};

describe("review", () => {
  it("does not allow reviewing a future booking", () => {
    const result = getReviewEligibility({
      ...baseEligibilityInput,
      date: new Date("2026-02-26T13:00:00.000Z"),
      endAt: null,
      now,
    });

    expect(result.canReview).toBe(false);
    expect(result.reason).toBe("not-finished");
  });

  it("does not allow reviewing a canceled booking", () => {
    const result = getReviewEligibility({
      ...baseEligibilityInput,
      date: new Date("2026-02-26T10:00:00.000Z"),
      endAt: null,
      cancelledAt: new Date("2026-02-26T09:30:00.000Z"),
      now,
    });

    expect(result.canReview).toBe(false);
    expect(result.reason).toBe("cancelled");
  });

  it("does not allow reviewing another user's booking", () => {
    const result = getReviewEligibility({
      ...baseEligibilityInput,
      actorUserId: "user-2",
      date: new Date("2026-02-26T10:00:00.000Z"),
      endAt: null,
      now,
    });

    expect(result.canReview).toBe(false);
    expect(result.reason).toBe("not-owner");
  });

  it("does not allow duplicate reviews for the same booking", () => {
    const result = getReviewEligibility({
      ...baseEligibilityInput,
      date: new Date("2026-02-26T10:00:00.000Z"),
      endAt: null,
      hasReview: true,
      now,
    });

    expect(result.canReview).toBe(false);
    expect(result.reason).toBe("already-reviewed");
  });

  it("updates avgRating and ratingsCount from aggregate", async () => {
    const aggregateCalls: Array<unknown> = [];
    const updateCalls: Array<unknown> = [];

    const transaction: ReviewSummaryTransaction = {
      review: {
        aggregate: async (args) => {
          aggregateCalls.push(args);
          return {
            _avg: {
              rating: 4.5,
            },
            _count: {
              _all: 8,
            },
          };
        },
      },
      barbershop: {
        update: async (args) => {
          updateCalls.push(args);
        },
      },
    };

    const summary = await refreshBarbershopRatingSummary(
      transaction,
      "barbershop-1",
    );

    expect(aggregateCalls.length).toBe(1);
    expect(aggregateCalls[0]).toEqual({
      where: {
        barbershopId: "barbershop-1",
      },
      _avg: {
        rating: true,
      },
      _count: {
        _all: true,
      },
    });

    expect(summary).toEqual({
      avgRating: 4.5,
      ratingsCount: 8,
    });

    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0]).toEqual({
      where: {
        id: "barbershop-1",
      },
      data: {
        avgRating: 4.5,
        ratingsCount: 8,
      },
    });
  });
});
