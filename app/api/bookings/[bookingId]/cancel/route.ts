import { cancelBooking } from "@/actions/cancel-booking";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const paramsSchema = z.object({
  bookingId: z.uuid(),
});

const getValidationErrorMessage = (validationErrors: unknown) => {
  if (!validationErrors || typeof validationErrors !== "object") {
    return null;
  }

  const rootErrors = (validationErrors as { _errors?: unknown })._errors;
  if (!Array.isArray(rootErrors) || rootErrors.length === 0) {
    return null;
  }

  return typeof rootErrors[0] === "string" ? rootErrors[0] : null;
};

const normalizeForMessageMatch = (value: string) => {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const isUnauthorizedErrorMessage = (message: string) => {
  const normalizedMessage = normalizeForMessageMatch(message);
  return normalizedMessage.includes("nao autorizado") || normalizedMessage.includes("login");
};

interface CancelBookingRouteContext {
  params: Promise<{
    bookingId: string;
  }>;
}

export const POST = async (_request: Request, context: CancelBookingRouteContext) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json(
      {
        error: "Nao autorizado.",
      },
      { status: 401 },
    );
  }

  const parsedParams = paramsSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: "Booking invalido.",
      },
      { status: 400 },
    );
  }

  const cancelBookingResult = await cancelBooking({
    bookingId: parsedParams.data.bookingId,
  });

  const validationMessage = getValidationErrorMessage(
    cancelBookingResult.validationErrors,
  );
  if (validationMessage) {
    return NextResponse.json(
      {
        error: validationMessage,
      },
      { status: 400 },
    );
  }

  const serverMessage =
    typeof cancelBookingResult.serverError === "string" &&
    cancelBookingResult.serverError.trim().length > 0
      ? cancelBookingResult.serverError.trim()
      : null;
  if (serverMessage) {
    return NextResponse.json(
      {
        error: serverMessage,
      },
      { status: isUnauthorizedErrorMessage(serverMessage) ? 401 : 500 },
    );
  }

  if (!cancelBookingResult.data) {
    return NextResponse.json(
      {
        error: "Nao foi possivel cancelar o agendamento.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      bookingId: cancelBookingResult.data.id,
      cancelledAt: cancelBookingResult.data.cancelledAt,
    },
    { status: 200 },
  );
};
