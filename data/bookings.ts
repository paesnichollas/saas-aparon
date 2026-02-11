import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { CONFIRMED_BOOKING_PAYMENT_WHERE } from "@/lib/booking-payment";
import { prisma } from "@/lib/prisma";
import {
  reconcilePendingBookingBySessionId,
  reconcilePendingBookingsForBarbershop,
  reconcilePendingBookingsForUser,
} from "@/lib/stripe-booking-reconciliation";
import { headers } from "next/headers";

const USER_BOOKING_INCLUDE = {
  barbershop: true,
  barber: true,
  service: true,
  services: {
    include: {
      service: true,
    },
  },
} satisfies Prisma.BookingInclude;

const OWNER_BOOKING_INCLUDE = {
  user: true,
  barber: true,
  service: true,
  services: {
    include: {
      service: true,
    },
  },
} satisfies Prisma.BookingInclude;

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: typeof USER_BOOKING_INCLUDE;
}>;

export type OwnerBookingWithRelations = Prisma.BookingGetPayload<{
  include: typeof OWNER_BOOKING_INCLUDE;
}>;

interface GetUserBookingsOptions {
  stripeSessionId?: string;
}

export const getUserBookings = async (options?: GetUserBookingsOptions) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { confirmedBookings: [], finishedBookings: [] };
  }

  if (options?.stripeSessionId) {
    try {
      await reconcilePendingBookingBySessionId({
        stripeSessionId: options.stripeSessionId,
        userId: session.user.id,
      });
    } catch (error) {
      console.error("[getUserBookings] Failed to reconcile Stripe session id.", {
        error,
        stripeSessionId: options.stripeSessionId,
        userId: session.user.id,
      });
    }
  }

  try {
    await reconcilePendingBookingsForUser(session.user.id);
  } catch (error) {
    console.error(
      "[getUserBookings] Failed to reconcile pending bookings for user.",
      {
        error,
        userId: session.user.id,
      },
    );
  }

  const now = new Date();
  const [confirmedBookings, finishedBookings] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId: session.user.id,
        date: { gte: now },
        cancelledAt: null,
        AND: [CONFIRMED_BOOKING_PAYMENT_WHERE],
      },
      include: USER_BOOKING_INCLUDE,
      orderBy: { date: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { date: { lt: now } },
          { cancelledAt: { not: null } },
          { paymentStatus: "FAILED" },
        ],
      },
      include: USER_BOOKING_INCLUDE,
      orderBy: { date: "desc" },
    }),
  ]);

  return { confirmedBookings, finishedBookings };
};

export const getOwnerBarbershopBookings = async (
  barbershopId: string,
): Promise<OwnerBookingWithRelations[]> => {
  const normalizedBarbershopId = barbershopId.trim();

  if (!normalizedBarbershopId) {
    return [];
  }

  try {
    await reconcilePendingBookingsForBarbershop(normalizedBarbershopId);
  } catch (error) {
    console.error(
      "[getOwnerBarbershopBookings] Failed to reconcile pending bookings for barbershop.",
      {
        error,
        barbershopId: normalizedBarbershopId,
      },
    );
  }

  return prisma.booking.findMany({
    where: {
      barbershopId: normalizedBarbershopId,
    },
    include: OWNER_BOOKING_INCLUDE,
    orderBy: {
      date: "desc",
    },
  });
};
