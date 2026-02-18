import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "./ui/card";

type BookingSummaryService = {
  id?: string;
  name: string;
  priceInCents: number;
};

interface BookingSummaryProps {
  services: BookingSummaryService[];
  barbershopName: string;
  barberName?: string;
  date: Date;
  time?: string;
  totalDurationMinutes?: number;
  totalPriceInCents?: number;
}

const formatDuration = (durationInMinutes: number) => {
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
};

const BookingSummary = ({
  services,
  barbershopName,
  barberName,
  date,
  time,
  totalDurationMinutes,
  totalPriceInCents,
}: BookingSummaryProps) => {
  const formattedTime = time ?? format(date, "HH:mm");
  const calculatedTotalPriceInCents = services.reduce((accumulator, service) => {
    return accumulator + service.priceInCents;
  }, 0);
  const resolvedTotalPriceInCents =
    totalPriceInCents ?? calculatedTotalPriceInCents;
  const resolvedDurationInMinutes = totalDurationMinutes ?? 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Serviços</p>
          <div className="space-y-1">
            {services.map((service) => (
              <div
                key={service.id ?? service.name}
                className="flex items-center justify-between gap-2"
              >
                <p className="text-sm font-semibold">{service.name}</p>
                <p className="text-sm">{formatCurrency(service.priceInCents)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Data</p>
          <p className="text-sm">
            {format(date, "d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Horário</p>
          <p className="text-sm">{formattedTime}</p>
        </div>

        {barberName ? (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Barbeiro</p>
            <p className="text-sm">{barberName}</p>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Barbearia</p>
          <p className="text-sm">{barbershopName}</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Duração total</p>
          <p className="text-sm">{formatDuration(resolvedDurationInMinutes)}</p>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <p className="text-sm font-semibold">Valor total</p>
          <p className="text-sm font-bold">
            {formatCurrency(resolvedTotalPriceInCents)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingSummary;
