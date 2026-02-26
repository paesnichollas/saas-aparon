"use server";

import { Prisma } from "@/generated/prisma/client";
import { protectedActionClient } from "@/lib/action-client";
import {
  revalidateBookingSurfaces,
  revalidatePublicBarbershopCache,
} from "@/lib/cache-invalidation";
import { prisma } from "@/lib/prisma";
import {
  MAX_REVIEW_RATING,
  MIN_REVIEW_RATING,
  getReviewEligibility,
  normalizeOptionalReviewComment,
  refreshBarbershopRatingSummary,
} from "@/lib/review";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

const inputSchema = z.object({
  bookingId: z.uuid(),
  rating: z.number().int().min(MIN_REVIEW_RATING).max(MAX_REVIEW_RATING),
  comment: z.string().trim().max(600).optional(),
});

const getReviewValidationErrorMessage = (
  reason: ReturnType<typeof getReviewEligibility>["reason"],
) => {
  if (reason === "not-owner") {
    return "Você não tem permissão para avaliar este agendamento.";
  }

  if (reason === "cancelled") {
    return "Não é possível avaliar um agendamento cancelado.";
  }

  if (reason === "already-reviewed") {
    return "Este agendamento já foi avaliado.";
  }

  if (reason === "not-paid") {
    return "Somente agendamentos pagos podem ser avaliados.";
  }

  return "Você só pode avaliar após a conclusão do atendimento.";
};

export const createReview = protectedActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { bookingId, rating, comment }, ctx: { user } }) => {
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      select: {
        id: true,
        userId: true,
        cancelledAt: true,
        date: true,
        endAt: true,
        paymentStatus: true,
        barbershopId: true,
        barbershop: {
          select: {
            slug: true,
            publicSlug: true,
          },
        },
        review: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!booking) {
      returnValidationErrors(inputSchema, {
        _errors: ["Agendamento não encontrado."],
      });
    }

    const reviewEligibility = getReviewEligibility({
      actorUserId: user.id,
      bookingUserId: booking.userId,
      cancelledAt: booking.cancelledAt,
      date: booking.date,
      endAt: booking.endAt,
      paymentStatus: booking.paymentStatus,
      hasReview: Boolean(booking.review),
      now: new Date(),
    });

    if (!reviewEligibility.canReview) {
      returnValidationErrors(inputSchema, {
        _errors: [getReviewValidationErrorMessage(reviewEligibility.reason)],
      });
    }

    try {
      const createdReview = await prisma.$transaction(async (transaction) => {
        const review = await transaction.review.create({
          data: {
            bookingId: booking.id,
            barbershopId: booking.barbershopId,
            userId: user.id,
            rating,
            comment: normalizeOptionalReviewComment(comment),
          },
          select: {
            id: true,
            bookingId: true,
            barbershopId: true,
            userId: true,
            rating: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        await refreshBarbershopRatingSummary(transaction, booking.barbershopId);

        return review;
      });

      revalidateBookingSurfaces();
      revalidatePublicBarbershopCache({
        barbershopId: booking.barbershopId,
        slug: booking.barbershop.slug,
        publicSlug: booking.barbershop.publicSlug,
      });

      return createdReview;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        returnValidationErrors(inputSchema, {
          _errors: ["Este agendamento já foi avaliado."],
        });
      }

      throw error;
    }
  });
