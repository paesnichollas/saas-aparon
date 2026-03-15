import { createBookingCheckoutSession } from "@/actions/create-booking-checkout-session";
import {
  getServerErrorMessage,
  getValidationErrorMessage,
} from "@/lib/action-errors";
import { parseBody, requireAuth } from "@/lib/api-action-adapter";
import { parseBookingDateTime } from "@/lib/booking-time";
import {
  PROFILE_INCOMPLETE_ERROR_MESSAGE,
  PROFILE_INCOMPLETE_CODE,
  buildCompleteProfileUrl,
  getSafeReturnToPath,
  isProfileIncompleteCode,
} from "@/lib/profile-completion";
import { normalizeForMessageMatch } from "@/lib/string-helpers";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  barbershopId: z.uuid(),
  serviceId: z.uuid(),
  barberId: z.uuid(),
  date: z.string().trim().min(1),
  paymentMethod: z.enum(["STRIPE", "IN_PERSON"]).optional(),
});

const INVALID_DATE_MESSAGE =
  "Data e horário inválidos. Use o formato YYYY-MM-DDTHH:mm:ss.";

const isUnauthorizedMessage = (msg: string) => {
  const n = normalizeForMessageMatch(msg);
  return (
    n.includes("nao autorizado") ||
    n.includes("não autorizado") ||
    n.includes("login")
  );
};

const isConflictMessage = (msg: string) => {
  const n = msg.toLowerCase();
  return n.includes("agendad") || n.includes("ocupad");
};

const getCompleteProfileRedirectUrlFromRequest = (request: Request) => {
  const refererHeader = request.headers.get("referer");

  if (!refererHeader) {
    return buildCompleteProfileUrl("/");
  }

  try {
    const refererUrl = new URL(refererHeader);
    const refererPath = `${refererUrl.pathname}${refererUrl.search}`;
    return buildCompleteProfileUrl(getSafeReturnToPath(refererPath));
  } catch {
    return buildCompleteProfileUrl("/");
  }
};

export const POST = async (request: Request) => {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const parsed = await parseBody(request, requestSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const bookingDate = parseBookingDateTime(parsed.data.date);
  if (!bookingDate) {
    return NextResponse.json(
      {
        error: INVALID_DATE_MESSAGE,
      },
      { status: 400 },
    );
  }

  const result = await createBookingCheckoutSession({
    barbershopId: parsed.data.barbershopId,
    barberId: parsed.data.barberId,
    serviceIds: [parsed.data.serviceId],
    startAt: bookingDate,
    paymentMethod: parsed.data.paymentMethod,
  });

  const validationMessage = getValidationErrorMessage(result.validationErrors);
  if (validationMessage) {
    return NextResponse.json(
      { error: validationMessage },
      { status: isConflictMessage(validationMessage) ? 409 : 400 },
    );
  }

  const serverMessage = getServerErrorMessage(result.serverError);
  if (serverMessage) {
    if (isProfileIncompleteCode(serverMessage)) {
      return NextResponse.json(
        {
          code: PROFILE_INCOMPLETE_CODE,
          error: PROFILE_INCOMPLETE_ERROR_MESSAGE,
          redirectTo: getCompleteProfileRedirectUrlFromRequest(request),
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: serverMessage },
      { status: isUnauthorizedMessage(serverMessage) ? 401 : 500 },
    );
  }

  if (!result.data) {
    return NextResponse.json(
      {
        error: "Não foi possível criar o agendamento.",
      },
      { status: 500 },
    );
  }

  if (result.data.kind === "created") {
    return NextResponse.json(
      {
        bookingId: result.data.bookingId,
        requiresCheckout: false,
      },
      { status: 201 },
    );
  }

  return NextResponse.json(
    {
      bookingId: result.data.bookingId,
      requiresCheckout: true,
      sessionId: result.data.sessionId,
      checkoutUrl: result.data.checkoutUrl,
    },
    { status: 201 },
  );
};
