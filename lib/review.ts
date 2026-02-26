export const MIN_REVIEW_RATING = 1;
export const MAX_REVIEW_RATING = 5;

type ReviewPaymentStatus = "PENDING" | "PAID" | "FAILED";

export type ReviewEligibilityFailureReason =
  | "not-owner"
  | "cancelled"
  | "already-reviewed"
  | "not-paid"
  | "not-finished";

export interface ReviewEligibilityInput {
  actorUserId: string;
  bookingUserId: string;
  cancelledAt: Date | null;
  date: Date;
  endAt: Date | null;
  paymentStatus: ReviewPaymentStatus;
  hasReview: boolean;
  now?: Date;
}

interface ReviewEligibilityResult {
  canReview: boolean;
  reason: ReviewEligibilityFailureReason | null;
}

interface ReviewAggregateResult {
  _avg: {
    rating: number | null;
  };
  _count: {
    _all: number;
  };
}

export interface BarbershopRatingSummary {
  avgRating: number;
  ratingsCount: number;
}

export interface ReviewSummaryTransaction {
  review: {
    aggregate: (args: {
      where: {
        barbershopId: string;
      };
      _avg: {
        rating: true;
      };
      _count: {
        _all: true;
      };
    }) => Promise<ReviewAggregateResult>;
  };
  barbershop: {
    update: (args: {
      where: {
        id: string;
      };
      data: BarbershopRatingSummary;
    }) => Promise<unknown>;
  };
}

export const getReviewCompletionDate = (input: {
  date: Date;
  endAt: Date | null;
}) => {
  return input.endAt ?? input.date;
};

export const getReviewEligibility = ({
  actorUserId,
  bookingUserId,
  cancelledAt,
  date,
  endAt,
  paymentStatus,
  hasReview,
  now = new Date(),
}: ReviewEligibilityInput): ReviewEligibilityResult => {
  if (bookingUserId !== actorUserId) {
    return {
      canReview: false,
      reason: "not-owner",
    };
  }

  if (cancelledAt) {
    return {
      canReview: false,
      reason: "cancelled",
    };
  }

  if (hasReview) {
    return {
      canReview: false,
      reason: "already-reviewed",
    };
  }

  if (paymentStatus !== "PAID") {
    return {
      canReview: false,
      reason: "not-paid",
    };
  }

  if (getReviewCompletionDate({ date, endAt }) >= now) {
    return {
      canReview: false,
      reason: "not-finished",
    };
  }

  return {
    canReview: true,
    reason: null,
  };
};

export const isValidReviewRating = (rating: number) => {
  return (
    Number.isInteger(rating) &&
    rating >= MIN_REVIEW_RATING &&
    rating <= MAX_REVIEW_RATING
  );
};

export const normalizeOptionalReviewComment = (
  value: string | null | undefined,
) => {
  const normalizedValue = value?.trim() ?? "";
  return normalizedValue.length > 0 ? normalizedValue : null;
};

export const refreshBarbershopRatingSummary = async (
  tx: ReviewSummaryTransaction,
  barbershopId: string,
): Promise<BarbershopRatingSummary> => {
  const ratingsAggregate = await tx.review.aggregate({
    where: {
      barbershopId,
    },
    _avg: {
      rating: true,
    },
    _count: {
      _all: true,
    },
  });

  const summary = {
    avgRating: ratingsAggregate._avg.rating ?? 0,
    ratingsCount: ratingsAggregate._count._all,
  };

  await tx.barbershop.update({
    where: {
      id: barbershopId,
    },
    data: summary,
  });

  return summary;
};
