import {
  parseReportMonth,
  parseReportYear,
  resolveReportBarbershopIdForRole,
  type ReportBarbershopAccessResult,
} from "@/data/reports-shared";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export type ReportRouteContext = {
  userId: string;
  role: "OWNER" | "ADMIN";
  barbershopId: string;
  year: number;
  month: number | null;
};

export const resolveReportRouteContext = async (query: {
  year?: string;
  month?: string;
  barbershopId?: string;
}): Promise<
  | { ok: true; context: ReportRouteContext }
  | { ok: false; response: NextResponse }
> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 },
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 },
      ),
    };
  }

  if (user.role !== "OWNER" && user.role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 },
      ),
    };
  }

  const year = parseReportYear(query.year);
  if (year === null) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Ano inválido." }, { status: 400 }),
    };
  }

  const requestedMonth = parseReportMonth(query.month);
  if (query.month && requestedMonth === null) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Mês inválido." }, { status: 400 }),
    };
  }

  const resolvedBarbershop: ReportBarbershopAccessResult =
    await resolveReportBarbershopIdForRole({
      userId: user.id,
      role: user.role,
      requestedBarbershopId: query.barbershopId,
    });

  if (!resolvedBarbershop.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: resolvedBarbershop.error },
        { status: resolvedBarbershop.status },
      ),
    };
  }

  return {
    ok: true,
    context: {
      userId: user.id,
      role: user.role,
      barbershopId: resolvedBarbershop.barbershopId,
      year,
      month: requestedMonth,
    },
  };
};

export const noStoreHeaders = () => ({
  "cache-control": "no-store",
});
