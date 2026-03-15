import {
  aggregateReportMetrics,
  getMonthlyReportRanges,
  getWeeklyReportRanges,
  getYearlyReportRanges,
  resolveSummaryMonth,
  toRangeResponse,
} from "@/data/reports-shared";
import { resolveReportRouteContext } from "@/lib/reports-route-helpers";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  period: z.enum(["week", "month", "year"]),
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

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const parsedQuery = querySchema.safeParse({
    period: requestUrl.searchParams.get("period") ?? undefined,
    year: requestUrl.searchParams.get("year") ?? undefined,
    month: requestUrl.searchParams.get("month") ?? undefined,
    barbershopId: requestUrl.searchParams.get("barbershopId") ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos." },
      { status: 400 },
    );
  }

  const resolved = await resolveReportRouteContext({
    year: parsedQuery.data.year,
    month: parsedQuery.data.month,
    barbershopId: parsedQuery.data.barbershopId,
  });

  if (!resolved.ok) {
    return resolved.response;
  }

  const { barbershopId, year, month } = resolved.context;
  const period = parsedQuery.data.period;
  let ranges: ReturnType<typeof getWeeklyReportRanges> | null = null;

  if (period === "week") {
    ranges = getWeeklyReportRanges();
  } else if (period === "month") {
    const resolvedMonth = resolveSummaryMonth({
      year,
      requestedMonth: month,
    });

    ranges = getMonthlyReportRanges(year, resolvedMonth);
  } else {
    ranges = getYearlyReportRanges(year);
  }

  if (!ranges) {
    return NextResponse.json(
      {
        error: "Período inválido para gerar o relatório.",
      },
      {
        status: 400,
      },
    );
  }

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

  const response = NextResponse.json(
    {
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
    },
    {
      status: 200,
    },
  );

  response.headers.set("cache-control", "no-store");
  return response;
}
