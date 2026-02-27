import { getBarbershopMonthlySummary } from "@/data/reports";
import {
  aggregateReportMetrics,
  calculateAverageTicket,
  getMonthlyReportRanges,
  getWeeklyReportRanges,
  getYearlyReportRanges,
  parseReportMonth,
  parseReportYear,
  resolveReportBarbershopIdForRole,
  resolveSummaryMonth,
  toRangeResponse,
  type ReportDateRange,
} from "@/data/reports-shared";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/)
    .optional(),
  month: z
    .string()
    .trim()
    .regex(/^\d{1,2}$/)
    .optional(),
  barbershopId: z.string().uuid().optional(),
});

const calculateDeltaPercent = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const buildSummary = async ({
  barbershopId,
  ranges,
}: {
  barbershopId: string;
  ranges: {
    current: ReportDateRange;
    previous: ReportDateRange;
  };
}) => {
  const [current, previous] = await Promise.all([
    aggregateReportMetrics({
      barbershopId,
      range: ranges.current,
    }),
    aggregateReportMetrics({
      barbershopId,
      range: ranges.previous,
    }),
  ]);

  return {
    current: {
      ...current,
      ...toRangeResponse(ranges.current),
    },
    previous: {
      ...previous,
      ...toRangeResponse(ranges.previous),
    },
    delta: {
      bookingsPercent: calculateDeltaPercent(
        current.totalBookings,
        previous.totalBookings,
      ),
      revenuePercent: calculateDeltaPercent(current.revenue, previous.revenue),
      ticketPercent: calculateDeltaPercent(current.avgTicket, previous.avgTicket),
    },
  };
};

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: "Não autorizado.",
      },
      {
        status: 401,
      },
    );
  }

  const requestUrl = new URL(request.url);
  const parsedQuery = querySchema.safeParse({
    year: requestUrl.searchParams.get("year") ?? undefined,
    month: requestUrl.searchParams.get("month") ?? undefined,
    barbershopId: requestUrl.searchParams.get("barbershopId") ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Parâmetros inválidos.",
      },
      {
        status: 400,
      },
    );
  }

  const year = parseReportYear(parsedQuery.data.year);

  if (year === null) {
    return NextResponse.json(
      {
        error: "Ano inválido.",
      },
      {
        status: 400,
      },
    );
  }

  const requestedMonth = parseReportMonth(parsedQuery.data.month);

  if (parsedQuery.data.month && requestedMonth === null) {
    return NextResponse.json(
      {
        error: "Mês inválido.",
      },
      {
        status: 400,
      },
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        error: "Não autorizado.",
      },
      {
        status: 401,
      },
    );
  }

  if (user.role !== "OWNER" && user.role !== "ADMIN") {
    return NextResponse.json(
      {
        error: "Acesso negado.",
      },
      {
        status: 403,
      },
    );
  }

  const resolvedBarbershop = await resolveReportBarbershopIdForRole({
    userId: user.id,
    role: user.role,
    requestedBarbershopId: parsedQuery.data.barbershopId,
  });

  if (!resolvedBarbershop.ok) {
    return NextResponse.json(
      {
        error: resolvedBarbershop.error,
      },
      {
        status: resolvedBarbershop.status,
      },
    );
  }

  const summaryMonth = resolveSummaryMonth({
    year,
    requestedMonth,
  });

  const monthlyRanges = getMonthlyReportRanges(year, summaryMonth);
  const yearlyRanges = getYearlyReportRanges(year);

  if (!monthlyRanges || !yearlyRanges) {
    return NextResponse.json(
      {
        error: "Período inválido para gerar o relatório.",
      },
      {
        status: 400,
      },
    );
  }

  const weeklyRanges = getWeeklyReportRanges();
  const barbershopId = resolvedBarbershop.barbershopId;

  const [months, weekSummary, monthSummary, yearSummary] = await Promise.all([
    getBarbershopMonthlySummary({
      barbershopId,
      year,
    }),
    buildSummary({
      barbershopId,
      ranges: weeklyRanges,
    }),
    buildSummary({
      barbershopId,
      ranges: monthlyRanges,
    }),
    buildSummary({
      barbershopId,
      ranges: yearlyRanges,
    }),
  ]);

  const totalBookings = months.reduce((sum, month) => sum + month.totalBookings, 0);
  const revenue = months.reduce((sum, month) => sum + month.revenue, 0);
  const averageTicket = calculateAverageTicket(revenue, totalBookings);

  const response = NextResponse.json(
    {
      monthlySummary: {
        year,
        barbershopId,
        months,
        totals: {
          totalBookings,
          revenue,
          averageTicket,
        },
      },
      summaries: {
        week: weekSummary,
        month: monthSummary,
        year: yearSummary,
      },
    },
    {
      status: 200,
    },
  );

  response.headers.set("cache-control", "no-store");

  return response;
}
