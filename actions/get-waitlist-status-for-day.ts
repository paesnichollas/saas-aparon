"use server";

import { protectedActionClient } from "@/lib/action-client";
import { getBookingDateKey, parseBookingDateOnly } from "@/lib/booking-time";
import { prisma } from "@/lib/prisma";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

const inputSchema = z.object({
  barbershopId: z.uuid(),
  barberId: z.uuid(),
  serviceId: z.uuid(),
  dateDay: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/),
});

const defaultWaitlistStatus = {
  isInQueue: false,
  entryId: null as string | null,
  position: null as number | null,
  queueLength: 0,
};

export const getWaitlistStatusForDay = protectedActionClient
  .inputSchema(inputSchema)
  .action(
    async ({
      parsedInput: { barbershopId, barberId, serviceId, dateDay },
      ctx: { user },
    }) => {
      const parsedDateDay = parseBookingDateOnly(dateDay);

      if (!parsedDateDay) {
        returnValidationErrors(inputSchema, {
          _errors: ["Dia invalido para consulta da fila de espera."],
        });
      }

      const [barbershop, barber, service] = await Promise.all([
        prisma.barbershop.findUnique({
          where: {
            id: barbershopId,
          },
          select: {
            id: true,
            isActive: true,
          },
        }),
        prisma.barber.findFirst({
          where: {
            id: barberId,
            barbershopId,
          },
          select: {
            id: true,
          },
        }),
        prisma.barbershopService.findFirst({
          where: {
            id: serviceId,
            barbershopId,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        }),
      ]);

      if (!barbershop || !barbershop.isActive || !barber || !service) {
        return defaultWaitlistStatus;
      }

      const [entry, queueLength] = await Promise.all([
        prisma.waitlistEntry.findFirst({
          where: {
            userId: user.id,
            barbershopId,
            barberId,
            serviceId,
            dateDay: parsedDateDay,
            status: "ACTIVE",
          },
          select: {
            id: true,
            createdAt: true,
          },
        }),
        prisma.waitlistEntry.count({
          where: {
            barbershopId,
            barberId,
            serviceId,
            dateDay: parsedDateDay,
            status: "ACTIVE",
          },
        }),
      ]);

      if (!entry) {
        return defaultWaitlistStatus;
      }

      const position = await prisma.waitlistEntry.count({
        where: {
          barbershopId,
          barberId,
          serviceId,
          dateDay: parsedDateDay,
          status: "ACTIVE",
          OR: [
            {
              createdAt: {
                lt: entry.createdAt,
              },
            },
            {
              createdAt: entry.createdAt,
              id: {
                lte: entry.id,
              },
            },
          ],
        },
      });

      return {
        isInQueue: true,
        entryId: entry.id,
        position,
        queueLength,
        dateDay: getBookingDateKey(parsedDateDay),
      };
    },
  );
