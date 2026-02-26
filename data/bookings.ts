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

const BOOKING_BASE_SELECT = {
  id: true,
  stripeChargeId: true,
  paymentMethod: true,
  paymentStatus: true,
  totalDurationMinutes: true,
  totalPriceInCents: true,
  startAt: true,
  endAt: true,
  date: true,
  cancelledAt: true,
} satisfies Prisma.BookingSelect;

const USER_BOOKING_SELECT = {
  ...BOOKING_BASE_SELECT,
  barbershop: {
    select: {
      id: true,
      name: true,
      address: true,
      imageUrl: true,
      phones: true,
    },
  },
  barber: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  },
  service: {
    select: {
      id: true,
      name: true,
      priceInCents: true,
      durationInMinutes: true,
    },
  },
  review: {
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
  },
  services: {
    select: {
      service: {
        select: {
          id: true,
          name: true,
          priceInCents: true,
          durationInMinutes: true,
        },
      },
    },
  },
} satisfies Prisma.BookingSelect;

const OWNER_BOOKING_SELECT = {
  ...BOOKING_BASE_SELECT,
  user: {
    select: {
      id: true,
      name: true,
      phone: true,
    },
  },
  barber: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  },
  service: {
    select: {
      id: true,
      name: true,
    },
  },
  services: {
    select: {
      service: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.BookingSelect;

export type BookingWithRelations = Prisma.BookingGetPayload<{
  select: typeof USER_BOOKING_SELECT;
}>;

export type OwnerBookingWithRelations = Prisma.BookingGetPayload<{
  select: typeof OWNER_BOOKING_SELECT;
}>;

interface GetUserBookingsOptions {
  stripeSessionId?: string;
}

const getAuthenticatedUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
};

const getConfirmedBookingsByUserId = (userId: string, now: Date) => {
  return prisma.booking.findMany({
    where: {
      userId,
      date: { gte: now },
      cancelledAt: null,
      AND: [CONFIRMED_BOOKING_PAYMENT_WHERE],
    },
    select: USER_BOOKING_SELECT,
    orderBy: { date: "asc" },
  });
};

const getFinishedBookingsByUserId = (userId: string, now: Date) => {
  return prisma.booking.findMany({
    where: {
      userId,
      OR: [
        { date: { lt: now } },
        { cancelledAt: { not: null } },
        { paymentStatus: "FAILED" },
      ],
    },
    select: USER_BOOKING_SELECT,
    orderBy: { date: "desc" },
  });
};

export const getUserConfirmedBookings = async () => {
  const user = await getAuthenticatedUser();

  if (!user) {
    return [];
  }

  return getConfirmedBookingsByUserId(user.id, new Date());
};

export const getUserBookings = async (options?: GetUserBookingsOptions) => {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { confirmedBookings: [], finishedBookings: [] };
  }

  if (options?.stripeSessionId) {
    try {
      await reconcilePendingBookingBySessionId({
        stripeSessionId: options.stripeSessionId,
        userId: user.id,
      });
    } catch (error) {
      console.error("[getUserBookings] Failed to reconcile Stripe session id.", {
        error,
        stripeSessionId: options.stripeSessionId,
        userId: user.id,
      });
    }
  }

  try {
    await reconcilePendingBookingsForUser(user.id);
  } catch (error) {
    console.error(
      "[getUserBookings] Failed to reconcile pending bookings for user.",
      {
        error,
        userId: user.id,
      },
    );
  }

  const now = new Date();
  const [confirmedBookings, finishedBookings] = await Promise.all([
    getConfirmedBookingsByUserId(user.id, now),
    getFinishedBookingsByUserId(user.id, now),
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
    select: OWNER_BOOKING_SELECT,
    orderBy: {
      date: "desc",
    },
  });
};
