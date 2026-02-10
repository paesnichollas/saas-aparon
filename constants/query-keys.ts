export const queryKeys = {
  getDateAvailableTimeSlots: (
    barbershopId: string,
    barberId: string | undefined,
    serviceIds: string[],
    date?: Date,
  ) => [
    "date-available-time-slots",
    barbershopId,
    barberId,
    serviceIds.join(","),
    date?.toISOString(),
  ],
};
