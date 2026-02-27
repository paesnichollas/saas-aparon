"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBookingCurrentMonth, getBookingCurrentYear } from "@/lib/booking-time";
import { formatCurrency } from "@/lib/utils";

type MonthlySummaryMonth = {
  month: number;
  label: string;
  totalBookings: number;
  revenue: number;
  avgTicket?: number;
};

type MonthlySummaryTotals = {
  totalBookings: number;
  revenue: number;
  averageTicket: number;
};

type MonthlySummaryData = {
  year: number;
  barbershopId: string;
  months: MonthlySummaryMonth[];
  totals: MonthlySummaryTotals;
};

type ReportSummaryMetric = {
  totalBookings: number;
  revenue: number;
  avgTicket: number;
  rangeStart: string;
  rangeEnd: string;
};

type ReportSummaryData = {
  current: ReportSummaryMetric;
  previous: ReportSummaryMetric;
  delta: {
    bookingsPercent: number | null;
    revenuePercent: number | null;
    ticketPercent: number | null;
  };
};

type ReportDashboardData = {
  monthlySummary: MonthlySummaryData;
  summaries: {
    week: ReportSummaryData;
    month: ReportSummaryData;
    year: ReportSummaryData;
  };
};

type NormalizedMonthlySummaryMonth = Omit<MonthlySummaryMonth, "avgTicket"> & {
  avgTicket: number;
};

type BarbershopOption = {
  id: string;
  name: string;
};

type OwnerReportsCardProps = {
  isAdmin: boolean;
  initialBarbershopId: string | null;
  barbershopOptions: BarbershopOption[];
};

type ChartPoint = NormalizedMonthlySummaryMonth & {
  isFutureMonth: boolean;
  revenuePast: number | null;
  revenueFuture: number | null;
};

type DeltaMetric = {
  label: string;
  value: number | null;
};

type KpiCardProps = {
  title: string;
  summary: ReportSummaryData | null;
  isPending: boolean;
  comparisonLabel: string;
};

const monthlySummaryMonthLabels = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

const monthlySummaryMonthsFallback: NormalizedMonthlySummaryMonth[] =
  monthlySummaryMonthLabels.map((label, index) => ({
    month: index + 1,
    label,
    totalBookings: 0,
    revenue: 0,
    avgTicket: 0,
  }));

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const buildYearOptions = (currentYear: number) => {
  return [currentYear];
};

const calculateAverageTicket = (revenue: number, totalBookings: number) => {
  if (totalBookings <= 0) {
    return 0;
  }

  return Math.round(revenue / totalBookings);
};

const parseMonthValue = (value: string) => {
  const parsedMonth = Number(value);

  if (
    Number.isNaN(parsedMonth) ||
    !Number.isInteger(parsedMonth) ||
    parsedMonth < 1 ||
    parsedMonth > 12
  ) {
    return null;
  }

  return parsedMonth;
};

const getInitialMonthForYear = ({
  year,
  currentYear,
  currentMonth,
}: {
  year: number;
  currentYear: number;
  currentMonth: number;
}) => {
  if (year === currentYear) {
    return currentMonth;
  }

  return 1;
};

const getApiErrorMessage = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const error = (value as { error?: unknown }).error;
  if (typeof error !== "string") {
    return null;
  }

  return error;
};

const hasMonthlySummaryShape = (value: unknown): value is MonthlySummaryData => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const parsedValue = value as Partial<MonthlySummaryData>;

  return (
    typeof parsedValue.year === "number" &&
    typeof parsedValue.barbershopId === "string" &&
    Array.isArray(parsedValue.months) &&
    parsedValue.months.length === 12 &&
    parsedValue.months.every(
      (month) =>
        typeof month.month === "number" &&
        typeof month.label === "string" &&
        typeof month.totalBookings === "number" &&
        typeof month.revenue === "number" &&
        (typeof month.avgTicket === "number" || typeof month.avgTicket === "undefined"),
    ) &&
    typeof parsedValue.totals?.totalBookings === "number" &&
    typeof parsedValue.totals?.revenue === "number" &&
    typeof parsedValue.totals?.averageTicket === "number"
  );
};

const hasSummaryShape = (value: unknown): value is ReportSummaryData => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const parsedValue = value as Partial<ReportSummaryData>;

  return (
    typeof parsedValue.current?.totalBookings === "number" &&
    typeof parsedValue.current?.revenue === "number" &&
    typeof parsedValue.current?.avgTicket === "number" &&
    typeof parsedValue.current?.rangeStart === "string" &&
    typeof parsedValue.current?.rangeEnd === "string" &&
    typeof parsedValue.previous?.totalBookings === "number" &&
    typeof parsedValue.previous?.revenue === "number" &&
    typeof parsedValue.previous?.avgTicket === "number" &&
    typeof parsedValue.previous?.rangeStart === "string" &&
    typeof parsedValue.previous?.rangeEnd === "string" &&
    (typeof parsedValue.delta?.bookingsPercent === "number" ||
      parsedValue.delta?.bookingsPercent === null) &&
    (typeof parsedValue.delta?.revenuePercent === "number" ||
      parsedValue.delta?.revenuePercent === null) &&
    (typeof parsedValue.delta?.ticketPercent === "number" ||
      parsedValue.delta?.ticketPercent === null)
  );
};

const hasDashboardShape = (value: unknown): value is ReportDashboardData => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const parsedValue = value as Partial<ReportDashboardData>;

  return (
    hasMonthlySummaryShape(parsedValue.monthlySummary) &&
    hasSummaryShape(parsedValue.summaries?.week) &&
    hasSummaryShape(parsedValue.summaries?.month) &&
    hasSummaryShape(parsedValue.summaries?.year)
  );
};

const formatDateLabel = (isoDate: string) => {
  const parsedDate = new Date(isoDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString("pt-BR");
};

const formatDateRangeLabel = (rangeStart: string, rangeEnd: string) => {
  return `${formatDateLabel(rangeStart)} ate ${formatDateLabel(rangeEnd)}`;
};

const formatPercentLabel = (value: number | null) => {
  if (value === null) {
    return "Novo";
  }

  const roundedValue = Number(value.toFixed(1));
  const normalizedValue = Number.isInteger(roundedValue)
    ? roundedValue.toFixed(0)
    : roundedValue.toFixed(1);

  if (roundedValue > 0) {
    return `+${normalizedValue}%`;
  }

  return `${normalizedValue}%`;
};

const DeltaLabel = ({ label, value }: DeltaMetric) => {
  if (value === null) {
    return (
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <ArrowUpRight className="h-3.5 w-3.5" />
        <span>
          {label}: Novo
        </span>
      </p>
    );
  }

  if (value > 0) {
    return (
      <p className="text-primary flex items-center gap-1.5 text-xs">
        <ArrowUpRight className="h-3.5 w-3.5" />
        <span>
          {label}: {formatPercentLabel(value)}
        </span>
      </p>
    );
  }

  if (value < 0) {
    return (
      <p className="text-destructive flex items-center gap-1.5 text-xs">
        <ArrowDownRight className="h-3.5 w-3.5" />
        <span>
          {label}: {formatPercentLabel(value)}
        </span>
      </p>
    );
  }

  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <ArrowRight className="h-3.5 w-3.5" />
      <span>
        {label}: 0%
      </span>
    </p>
  );
};

const KpiCard = ({ title, summary, isPending, comparisonLabel }: KpiCardProps) => {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{title}</CardTitle>
        {summary ? (
          <CardDescription>
            {formatDateRangeLabel(summary.current.rangeStart, summary.current.rangeEnd)}
          </CardDescription>
        ) : (
          <CardDescription>-</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending && !summary ? (
          <div className="space-y-2">
            <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
            <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
            <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Agendamentos</p>
              <p className="text-xl font-semibold">
                {(summary?.current.totalBookings ?? 0).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Faturamento</p>
              <p className="text-xl font-semibold">
                {formatCurrency(summary?.current.revenue ?? 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Ticket medio</p>
              <p className="text-xl font-semibold">
                {formatCurrency(summary?.current.avgTicket ?? 0)}
              </p>
            </div>
            <div className="space-y-1.5 border-t pt-3">
              <p className="text-muted-foreground text-xs">{comparisonLabel}</p>
              <DeltaLabel
                label="Agendamentos"
                value={summary ? summary.delta.bookingsPercent : 0}
              />
              <DeltaLabel
                label="Faturamento"
                value={summary ? summary.delta.revenuePercent : 0}
              />
              <DeltaLabel
                label="Ticket"
                value={summary ? summary.delta.ticketPercent : 0}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const AnnualChartTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: ChartPoint;
  }>;
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const chartPoint = payload[0]?.payload;

  if (!chartPoint) {
    return null;
  }

  return (
    <Card className="border-border min-w-[11rem] border shadow-sm">
      <CardContent className="space-y-1 py-3">
        <p className="text-sm font-semibold">{chartPoint.label}</p>
        <p className="text-muted-foreground text-xs">
          Agendamentos: {chartPoint.totalBookings.toLocaleString("pt-BR")}
        </p>
        <p className="text-muted-foreground text-xs">
          Faturamento: {formatCurrency(chartPoint.revenue)}
        </p>
        <p className="text-muted-foreground text-xs">
          Ticket medio: {formatCurrency(chartPoint.avgTicket)}
        </p>
      </CardContent>
    </Card>
  );
};

const OwnerReportsCard = ({
  isAdmin,
  initialBarbershopId,
  barbershopOptions,
}: OwnerReportsCardProps) => {
  const [selectedYear, setSelectedYear] = useState(() => getBookingCurrentYear());
  const [selectedBarbershopId, setSelectedBarbershopId] = useState(
    initialBarbershopId ?? "",
  );
  const bookingNow = useMemo(() => new Date(), []);
  const currentBookingYear = useMemo(() => getBookingCurrentYear(bookingNow), [bookingNow]);
  const currentBookingMonth = useMemo(
    () => getBookingCurrentMonth(bookingNow),
    [bookingNow],
  );
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getInitialMonthForYear({
      year: getBookingCurrentYear(),
      currentYear: currentBookingYear,
      currentMonth: currentBookingMonth,
    }),
  );

  const [dashboardData, setDashboardData] = useState<ReportDashboardData | null>(
    null,
  );
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isDashboardPending, setIsDashboardPending] = useState(false);
  const [isFilterTransitionPending, startFilterTransition] = useTransition();

  const canLoadReport = !isAdmin || selectedBarbershopId.length > 0;
  const isFilterControlDisabled = isDashboardPending || isFilterTransitionPending;
  const yearOptions = useMemo(
    () => buildYearOptions(currentBookingYear),
    [currentBookingYear],
  );

  const selectedBarbershopName = useMemo(() => {
    if (!isAdmin) {
      return null;
    }

    const selectedBarbershop = barbershopOptions.find(
      (barbershop) => barbershop.id === selectedBarbershopId,
    );

    return selectedBarbershop?.name ?? null;
  }, [barbershopOptions, isAdmin, selectedBarbershopId]);

  useEffect(() => {
    if (!canLoadReport) {
      setDashboardData(null);
      setDashboardError(null);
      return;
    }

    const abortController = new AbortController();

    const loadDashboard = async () => {
      setIsDashboardPending(true);
      setDashboardError(null);

      const queryParams = new URLSearchParams({
        year: String(selectedYear),
        month: String(selectedMonth),
      });

      if (selectedBarbershopId) {
        queryParams.set("barbershopId", selectedBarbershopId);
      }

      try {
        const response = await fetch(`/api/reports/dashboard?${queryParams.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: abortController.signal,
        });
        const responseData = (await response.json()) as unknown;

        if (!response.ok) {
          const errorMessage =
            getApiErrorMessage(responseData) ??
            "Não foi possível carregar o relatório.";
          throw new Error(errorMessage);
        }

        if (!hasDashboardShape(responseData)) {
          throw new Error("Relatório inválido.");
        }

        setDashboardData(responseData);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setDashboardData(null);
        setDashboardError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o relatório.",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsDashboardPending(false);
        }
      }
    };

    loadDashboard();

    return () => {
      abortController.abort();
    };
  }, [canLoadReport, selectedBarbershopId, selectedMonth, selectedYear]);

  const handleYearChange = (yearValue: string) => {
    const parsedYear = Number(yearValue);

    if (Number.isNaN(parsedYear)) {
      return;
    }

    startFilterTransition(() => {
      setSelectedYear(parsedYear);
      setSelectedMonth(
        getInitialMonthForYear({
          year: parsedYear,
          currentYear: currentBookingYear,
          currentMonth: currentBookingMonth,
        }),
      );
    });
  };

  const handleMonthChange = (monthValue: string) => {
    const parsedMonth = parseMonthValue(monthValue);

    if (!parsedMonth) {
      return;
    }

    startFilterTransition(() => {
      setSelectedMonth(parsedMonth);
    });
  };

  const handleBarbershopChange = (barbershopId: string) => {
    startFilterTransition(() => {
      setSelectedBarbershopId(barbershopId);
    });
  };

  const monthlySummary = dashboardData?.monthlySummary ?? null;
  const summaries = dashboardData?.summaries ?? null;

  const normalizedMonths = useMemo(() => {
    if (!monthlySummary || dashboardError) {
      return monthlySummaryMonthsFallback;
    }

    return monthlySummary.months.map((month) => ({
      month: month.month,
      label: month.label,
      totalBookings: month.totalBookings,
      revenue: month.revenue,
      avgTicket:
        typeof month.avgTicket === "number"
          ? month.avgTicket
          : calculateAverageTicket(month.revenue, month.totalBookings),
    }));
  }, [dashboardError, monthlySummary]);

  const detailsMonth = useMemo(() => {
    const month = normalizedMonths.find((item) => item.month === selectedMonth);

    return (
      month ??
      monthlySummaryMonthsFallback[selectedMonth - 1] ??
      monthlySummaryMonthsFallback[0]
    );
  }, [normalizedMonths, selectedMonth]);

  const chartData = useMemo<ChartPoint[]>(() => {
    return normalizedMonths.map((month) => {
      const isFutureMonth =
        selectedYear === currentBookingYear && month.month > currentBookingMonth;

      return {
        ...month,
        isFutureMonth,
        revenuePast: isFutureMonth ? null : month.revenue,
        revenueFuture: isFutureMonth ? month.revenue : null,
      };
    });
  }, [currentBookingMonth, currentBookingYear, normalizedMonths, selectedYear]);

  const isYearEmpty = useMemo(() => {
    return normalizedMonths.every(
      (month) => month.totalBookings === 0 && month.revenue === 0,
    );
  }, [normalizedMonths]);

  return (
    <Card data-testid="owner-reports-card">
      <CardHeader>
        <CardTitle>Relatório</CardTitle>
        <CardDescription>
          Indicadores semanais, mensais e anuais para acompanhar desempenho e
          faturamento.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="owner-report-year" className="text-sm font-medium">
              Ano
            </label>
            <select
              id="owner-report-year"
              value={selectedYear}
              onChange={(event) => handleYearChange(event.target.value)}
              disabled={isFilterControlDisabled}
              className="bg-background border-input h-9 w-full rounded-md border px-3 text-sm"
              data-testid="owner-report-year"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="owner-report-month" className="text-sm font-medium">
              Mês
            </label>
            <select
              id="owner-report-month"
              value={selectedMonth}
              onChange={(event) => handleMonthChange(event.target.value)}
              disabled={!canLoadReport || isFilterControlDisabled}
              className="bg-background border-input h-9 w-full rounded-md border px-3 text-sm"
              data-testid="owner-report-month"
            >
              {monthlySummaryMonthLabels.map((label, index) => {
                const monthNumber = index + 1;
                const isFutureMonth =
                  selectedYear === currentBookingYear && monthNumber > currentBookingMonth;

                return (
                  <option key={label} value={monthNumber} disabled={isFutureMonth}>
                    {label}
                    {isFutureMonth ? " (futuro)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {isAdmin ? (
            <div className="space-y-2">
              <label htmlFor="owner-report-barbershop" className="text-sm font-medium">
                Barbearia
              </label>
              <select
                id="owner-report-barbershop"
                value={selectedBarbershopId}
                onChange={(event) => handleBarbershopChange(event.target.value)}
                disabled={isFilterControlDisabled}
                className="bg-background border-input h-9 w-full rounded-md border px-3 text-sm"
                data-testid="owner-report-barbershop"
              >
                <option value="">Selecione uma barbearia</option>
                {barbershopOptions.map((barbershop) => (
                  <option key={barbershop.id} value={barbershop.id}>
                    {barbershop.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {!canLoadReport ? (
          <p className="text-muted-foreground text-sm">
            Selecione uma barbearia para visualizar o relatório.
          </p>
        ) : null}

        {dashboardError ? (
          <Card className="border-destructive/30">
            <CardContent>
              <p className="text-sm font-medium">{dashboardError}</p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-3" data-testid="owner-report-kpis">
          <KpiCard
            title="Semanal"
            summary={summaries?.week ?? null}
            isPending={isFilterControlDisabled}
            comparisonLabel="Comparado com a semana anterior"
          />
          <KpiCard
            title="Mensal"
            summary={summaries?.month ?? null}
            isPending={isFilterControlDisabled}
            comparisonLabel="Comparado com o mes anterior"
          />
          <KpiCard
            title="Anual"
            summary={summaries?.year ?? null}
            isPending={isFilterControlDisabled}
            comparisonLabel="Comparado com o ano anterior"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolucao anual ({selectedYear})</CardTitle>
            <CardDescription>
              Faturamento de janeiro a dezembro com tooltip por mes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isDashboardPending && !monthlySummary ? (
              <div className="bg-muted h-[18rem] animate-pulse rounded-md" />
            ) : (
              <div className="h-[20rem] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis
                      tickFormatter={(value: number) =>
                        compactCurrencyFormatter.format((value ?? 0) / 100)
                      }
                    />
                    <Tooltip
                      cursor={{
                        stroke: "var(--color-border)",
                        strokeWidth: 1,
                      }}
                      content={({ active, payload }) => (
                        <AnnualChartTooltip
                          active={active}
                          payload={
                            payload as Array<{
                              payload: ChartPoint;
                            }>
                          }
                        />
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenuePast"
                      stroke="var(--color-chart-1)"
                      strokeWidth={2}
                      dot={{
                        r: 3,
                        fill: "var(--color-chart-1)",
                      }}
                      activeDot={{
                        r: 5,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenueFuture"
                      stroke="var(--color-muted-foreground)"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{
                        r: 3,
                        fill: "var(--color-muted-foreground)",
                      }}
                      activeDot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {isYearEmpty && !isDashboardPending ? (
              <p className="text-muted-foreground text-sm">Sem agendamentos no periodo.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Detalhes do mes: {detailsMonth.label}/{selectedYear}
            </CardTitle>
            <CardDescription>
              Resumo do mes selecionado no dropdown.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Card className="border-dashed">
              <CardHeader className="space-y-1 pb-2">
                <CardDescription>Agendamentos no mes</CardDescription>
                <CardTitle className="text-2xl">
                  {detailsMonth.totalBookings.toLocaleString("pt-BR")}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-dashed">
              <CardHeader className="space-y-1 pb-2">
                <CardDescription>Faturamento no mes</CardDescription>
                <CardTitle className="text-2xl">
                  {formatCurrency(detailsMonth.revenue)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-dashed">
              <CardHeader className="space-y-1 pb-2">
                <CardDescription>Ticket medio no mes</CardDescription>
                <CardTitle className="text-2xl">
                  {formatCurrency(detailsMonth.avgTicket)}
                </CardTitle>
              </CardHeader>
            </Card>
          </CardContent>
        </Card>

        {selectedBarbershopName ? (
          <p className="text-muted-foreground text-sm">
            Barbearia selecionada: {selectedBarbershopName}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default OwnerReportsCard;
