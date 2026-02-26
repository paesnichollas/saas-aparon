import { getWaitlistStatusForDay } from "@/actions/get-waitlist-status-for-day";
import { queryKeys } from "@/constants/query-keys";
import { useQuery } from "@tanstack/react-query";

export const useGetWaitlistStatusForDay = ({
  barbershopId,
  barberId,
  serviceId,
  dateDay,
}: {
  barbershopId: string;
  barberId?: string;
  serviceId?: string;
  dateDay?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.getWaitlistStatusForDay(
      barbershopId,
      barberId,
      serviceId,
      dateDay,
    ),
    queryFn: () =>
      getWaitlistStatusForDay({
        barbershopId,
        barberId: barberId!,
        serviceId: serviceId!,
        dateDay: dateDay!,
      }),
    enabled: Boolean(barberId && serviceId && dateDay),
  });
};
