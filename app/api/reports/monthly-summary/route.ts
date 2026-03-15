import { getBarbershopMonthlySummary } from "@/data/reports";
import { calculateAverageTicket } from "@/data/reports-shared";
import { resolveReportRouteContext } from "@/lib/reports-route-helpers";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/)
    .optional(),
  barbershopId: z.string().uuid().optional(),
});

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const parsedQuery = querySchema.safeParse({
    year: requestUrl.searchParams.get("year") ?? undefined,
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
    barbershopId: parsedQuery.data.barbershopId,
  });

  if (!resolved.ok) {
    return resolved.response;
  }

  const { barbershopId, year } = resolved.context;

  const months = await getBarbershopMonthlySummary({
    barbershopId,
    year,
  });
  const totalBookings = months.reduce((sum, month) => sum + month.totalBookings, 0);
  const revenue = months.reduce((sum, month) => sum + month.revenue, 0);
  const averageTicket = calculateAverageTicket(revenue, totalBookings);

  const response = NextResponse.json(
    {
      year,
      barbershopId,
      months,
      totals: {
        totalBookings,
        revenue,
        averageTicket,
      },
    },
    { status: 200 },
  );

  response.headers.set("cache-control", "no-store");
  return response;
}
