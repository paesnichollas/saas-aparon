import Header from "@/components/header";
import Footer from "@/components/footer";
import BookingItem from "@/components/booking-item";
import OwnerBookingsList from "@/components/bookings/owner-bookings-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOwnerBarbershopBookings, getUserBookings } from "@/data/bookings";
import { requireAuthenticatedUser } from "@/lib/rbac";
import {
  PageContainer,
  PageSectionContent,
  PageSectionTitle,
} from "@/components/ui/page";

interface BookingsPageProps {
  searchParams: Promise<{
    session_id?: string | string[];
  }>;
}

const BookingsPage = async ({ searchParams }: BookingsPageProps) => {
  const user = await requireAuthenticatedUser();

  if (user.role === "OWNER") {
    const ownerBookings = user.barbershopId
      ? await getOwnerBarbershopBookings(user.barbershopId)
      : [];

    return (
      <div>
        <Header />
        <PageContainer>
          <h1 className="text-xl font-bold">Agendamentos da barbearia</h1>

          {!user.barbershopId ? (
            <PageSectionContent>
              <Card>
                <CardHeader>
                  <CardTitle>Nenhuma barbearia vinculada</CardTitle>
                  <CardDescription>
                    Vincule sua conta de dono a uma barbearia para visualizar as
                    reservas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Se o problema persistir, entre em contato com o suporte.
                  </p>
                </CardContent>
              </Card>
            </PageSectionContent>
          ) : (
            <PageSectionContent>
              <OwnerBookingsList
                bookings={ownerBookings}
                emptyMessage="Nenhuma reserva encontrada para sua barbearia."
              />
            </PageSectionContent>
          )}
        </PageContainer>
        <Footer />
      </div>
    );
  }

  const resolvedSearchParams = await searchParams;
  const stripeSessionId = Array.isArray(resolvedSearchParams.session_id)
    ? resolvedSearchParams.session_id[0]
    : resolvedSearchParams.session_id;
  const { confirmedBookings, finishedBookings } = await getUserBookings({
    stripeSessionId,
  });

  return (
    <div>
      <Header />
      <PageContainer>
        <h1 className="text-xl font-bold">Meus agendamentos</h1>

        <PageSectionContent>
          <PageSectionTitle>Confirmados</PageSectionTitle>
          {confirmedBookings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {confirmedBookings.map((booking) => (
                <BookingItem key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhum agendamento confirmado.
            </p>
          )}
        </PageSectionContent>

        <PageSectionContent>
          <PageSectionTitle>Finalizados</PageSectionTitle>
          {finishedBookings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {finishedBookings.map((booking) => (
                <BookingItem key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhum agendamento finalizado.
            </p>
          )}
        </PageSectionContent>
      </PageContainer>
      <Footer />
    </div>
  );
};

export default BookingsPage;
