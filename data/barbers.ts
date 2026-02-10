import { prisma } from "@/lib/prisma";

export const getBarbersByBarbershopId = async (barbershopId: string) => {
  return prisma.barber.findMany({
    where: {
      barbershopId,
    },
    orderBy: {
      name: "asc",
    },
  });
};
