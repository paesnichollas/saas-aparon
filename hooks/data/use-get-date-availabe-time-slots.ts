import { getDateAvailableTimeSlots } from "@/actions/get-date-available-time-slots";
import { queryKeys } from "@/constants/query-keys";
import { useQuery } from "@tanstack/react-query";

export const useGetDateAvailableTimeSlots = ({
  barbershopId,
  barberId,
  serviceIds,
  date,
}: {
  barbershopId: string;
  barberId?: string;
  serviceIds: string[];
  date?: Date;
}) => {
  return useQuery({
    queryKey: queryKeys.getDateAvailableTimeSlots(
      barbershopId,
      barberId,
      serviceIds,
      date,
    ),
    queryFn: () =>
      getDateAvailableTimeSlots({
        barbershopId,
        barberId: barberId!,
        serviceIds,
        date: date!,
      }),
    enabled: Boolean(date && barberId && serviceIds.length > 0),
  });
};
