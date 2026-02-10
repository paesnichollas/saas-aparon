import Header from "@/components/header";
import Footer from "@/components/footer";
import BookingItem from "@/components/booking-item";
import { getUserBookings } from "@/data/bookings";
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
        <h1 className="text-xl font-bold">Agendamentos</h1>

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
