"use server";

import { protectedActionClient } from "@/lib/action-client";
import { hasMinuteIntervalOverlap, toMinuteOfDay } from "@/lib/booking-interval";
import { prisma } from "@/lib/prisma";
import { endOfDay, isPast, startOfDay } from "date-fns";
import { returnValidationErrors } from "next-safe-action";
import Stripe from "stripe";
import z from "zod";

const inputSchema = z.object({
  serviceId: z.uuid(),
  date: z.date(),
});

export const createBookingCheckoutSession = protectedActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { serviceId, date }, ctx: { user } }) => {
    if (isPast(date)) {
      returnValidationErrors(inputSchema, {
        _errors: ["Data e hora selecionadas já passaram."],
      });
    }

    const service = await prisma.barbershopService.findFirst({
      where: {
        id: serviceId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        priceInCents: true,
        durationInMinutes: true,
        barbershopId: true,
        barbershop: {
          select: {
            name: true,
            stripeEnabled: true,
          },
        },
      },
    });

    if (!service) {
      returnValidationErrors(inputSchema, {
        _errors: ["Serviço não encontrado."],
      });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        barbershopId: service.barbershopId,
        date: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
        cancelledAt: null,
      },
      select: {
        date: true,
        service: {
          select: {
            durationInMinutes: true,
          },
        },
      },
    });

    const hasCollision = hasMinuteIntervalOverlap(
      toMinuteOfDay(date),
      service.durationInMinutes,
      bookings.map((booking) => {
        const startMinute = toMinuteOfDay(booking.date);
        return {
          startMinute,
          endMinute: startMinute + booking.service.durationInMinutes,
        };
      }),
    );

    if (hasCollision) {
      returnValidationErrors(inputSchema, {
        _errors: ["Data e hora selecionadas já estão agendadas."],
      });
    }

    if (!service.barbershop.stripeEnabled) {
      const booking = await prisma.booking.create({
        data: {
          serviceId: service.id,
          barbershopId: service.barbershopId,
          userId: user.id,
          date: date.toISOString(),
          paymentMethod: "IN_PERSON",
        },
        select: {
          id: true,
        },
      });

      return {
        kind: "created" as const,
        bookingId: booking.id,
      };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      returnValidationErrors(inputSchema, {
        _errors: ["Chave de API do Stripe não encontrada."],
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
      metadata: {
        serviceId: service.id,
        barbershopId: service.barbershopId,
        userId: user.id,
        date: date.toISOString(),
      },
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: service.priceInCents,
            product_data: {
              name: `${service.barbershop.name} - ${service.name}`,
              description: service.description,
              images: [service.imageUrl],
            },
          },
          quantity: 1,
        },
      ],
    });

    return {
      kind: "stripe" as const,
      sessionId: checkoutSession.id,
    };
  });
