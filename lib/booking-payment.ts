import { Prisma } from "@/generated/prisma/client";

export const ACTIVE_BOOKING_PAYMENT_WHERE: Prisma.BookingWhereInput = {
  OR: [
    {
      paymentMethod: "IN_PERSON",
    },
    {
      paymentStatus: {
        in: ["PENDING", "PAID"],
      },
    },
    {
      stripeChargeId: {
        not: null,
      },
    },
  ],
};

export const CONFIRMED_BOOKING_PAYMENT_WHERE: Prisma.BookingWhereInput = {
  OR: [
    {
      paymentMethod: "IN_PERSON",
    },
    {
      paymentStatus: "PAID",
    },
    {
      stripeChargeId: {
        not: null,
      },
    },
  ],
};
