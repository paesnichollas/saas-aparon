import { addMinutes } from "date-fns";

type ServiceForTotals = {
  durationInMinutes: number;
  priceInCents: number;
};

type BookingWithLegacyDuration = {
  startAt: Date | null;
  endAt: Date | null;
  date: Date;
  totalDurationMinutes: number | null;
  service?: {
    durationInMinutes: number;
  } | null;
};

export const calculateBookingTotals = (services: ServiceForTotals[]) => {
  return services.reduce(
    (accumulator, service) => {
      return {
        totalDurationMinutes:
          accumulator.totalDurationMinutes + service.durationInMinutes,
        totalPriceInCents: accumulator.totalPriceInCents + service.priceInCents,
      };
    },
    {
      totalDurationMinutes: 0,
      totalPriceInCents: 0,
    },
  );
};

export const getBookingStartDate = (booking: {
  startAt: Date | null;
  date: Date;
}) => {
  return booking.startAt ?? booking.date;
};

export const getBookingDurationMinutes = (
  booking: Pick<BookingWithLegacyDuration, "totalDurationMinutes" | "service">,
) => {
  if (
    booking.totalDurationMinutes &&
    Number.isInteger(booking.totalDurationMinutes) &&
    booking.totalDurationMinutes > 0
  ) {
    return booking.totalDurationMinutes;
  }

  if (booking.service?.durationInMinutes && booking.service.durationInMinutes > 0) {
    return booking.service.durationInMinutes;
  }

  return 0;
};

export const getBookingEndDate = (booking: BookingWithLegacyDuration) => {
  if (booking.endAt) {
    return booking.endAt;
  }

  const startAt = getBookingStartDate(booking);
  const durationInMinutes = getBookingDurationMinutes(booking);

  return addMinutes(startAt, durationInMinutes);
};
