import { cancelBooking } from "@/actions/cancel-booking";
import {
  getServerErrorMessage,
  getValidationErrorMessage,
} from "@/lib/action-errors";
import { parseParams, requireAuth } from "@/lib/api-action-adapter";
import { normalizeForMessageMatch } from "@/lib/string-helpers";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const paramsSchema = z.object({
  bookingId: z.uuid(),
});

const isUnauthorizedMessage = (msg: string) => {
  const n = normalizeForMessageMatch(msg);
  return n.includes("nao autorizado") || n.includes("login");
};

interface CancelBookingRouteContext {
  params: Promise<{
    bookingId: string;
  }>;
}

export const POST = async (_request: Request, context: CancelBookingRouteContext) => {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const parsed = await parseParams(context.params, paramsSchema);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Agendamento inválido." },
      { status: 400 },
    );
  }

  const result = await cancelBooking({
    bookingId: parsed.data.bookingId,
  });

  const validationMessage = getValidationErrorMessage(result.validationErrors);
  if (validationMessage) {
    return NextResponse.json({ error: validationMessage }, { status: 400 });
  }

  const serverMessage = getServerErrorMessage(result.serverError);
  if (serverMessage) {
    return NextResponse.json(
      { error: serverMessage },
      { status: isUnauthorizedMessage(serverMessage) ? 401 : 500 },
    );
  }

  if (!result.data) {
    return NextResponse.json(
      { error: "Não foi possível cancelar o agendamento." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      bookingId: result.data.id,
      cancelledAt: result.data.cancelledAt,
    },
    { status: 200 },
  );
};
