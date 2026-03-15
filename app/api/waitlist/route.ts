import { joinWaitlist } from "@/actions/join-waitlist";
import {
  handleActionJsonResponse,
  parseBody,
  requireAuth,
} from "@/lib/api-action-adapter";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  barbershopId: z.uuid(),
  barberId: z.uuid(),
  serviceId: z.uuid(),
  dateDay: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.enum(["STRIPE", "IN_PERSON"]).optional(),
});

export const POST = async (request: Request) => {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const parsed = await parseBody(request, requestSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const result = await joinWaitlist({
    barbershopId: parsed.data.barbershopId,
    barberId: parsed.data.barberId,
    serviceId: parsed.data.serviceId,
    dateDay: parsed.data.dateDay,
    paymentMethod: parsed.data.paymentMethod,
  });

  return handleActionJsonResponse(result, {
    successStatus: 201,
    conflictStatus: 400,
    noDataMessage: "Não foi possível entrar na fila de espera.",
  });
};
