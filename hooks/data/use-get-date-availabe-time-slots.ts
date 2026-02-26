import { getDateAvailableTimeSlots } from "@/actions/get-date-available-time-slots";
import { queryKeys } from "@/constants/query-keys";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

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
  const normalizedServiceIds = useMemo(() => {
    return Array.from(new Set(serviceIds)).sort((firstServiceId, secondServiceId) => {
      return firstServiceId.localeCompare(secondServiceId);
    });
  }, [serviceIds]);

  return useQuery({
    queryKey: queryKeys.getDateAvailableTimeSlots(
      barbershopId,
      barberId,
      normalizedServiceIds,
      date,
    ),
    queryFn: () =>
      getDateAvailableTimeSlots({
        barbershopId,
        barberId: barberId!,
        serviceIds: normalizedServiceIds,
        date: date!,
      }),
    enabled: Boolean(date && barberId && normalizedServiceIds.length > 0),
  });
};
