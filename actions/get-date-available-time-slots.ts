"use server";

import { actionClient } from "@/lib/action-client";
import { getAvailableBookingTimeSlots } from "@/lib/booking-availability";
import { z } from "zod";

const inputSchema = z.object({
  barbershopId: z.uuid(),
  barberId: z.uuid().optional(),
  serviceId: z.uuid().optional(),
  serviceIds: z.array(z.uuid()).min(1).optional(),
  date: z.date(),
});

export const getDateAvailableTimeSlots = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { barbershopId, barberId, serviceId, serviceIds, date } }) => {
    return getAvailableBookingTimeSlots({
      barbershopId,
      barberId,
      serviceIds: serviceIds ?? (serviceId ? [serviceId] : []),
      date,
    });
  });
