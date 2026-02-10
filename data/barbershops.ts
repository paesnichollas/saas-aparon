import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { CONFIRMED_BOOKING_PAYMENT_WHERE } from "@/lib/booking-payment";
import { reconcilePendingBookingsForBarbershop } from "@/lib/stripe-booking-reconciliation";

export type AdminBarbershopWithRelations = Prisma.BarbershopGetPayload<{
  include: {
    services: true;
    barbers: true;
    openingHours: true;
    bookings: {
      include: {
        barber: true;
        service: true;
        services: {
          include: {
            service: true;
          };
        };
        user: true;
      };
    };
  };
}>;

export const getBarbershops = async () => {
  const barbershops = await prisma.barbershop.findMany({
    where: {
      showInDirectory: true,
    },
  });
  return barbershops;
};

export const getPopularBarbershops = async () => {
  const popularBarbershops = await prisma.barbershop.findMany({
    where: {
      showInDirectory: true,
    },
    orderBy: {
      name: "desc",
    },
  });
  return popularBarbershops;
};

export const getBarbershopById = async (id: string) => {
  const barbershop = await prisma.barbershop.findUnique({
    where: { id },
    include: {
      barbers: {
        orderBy: {
          name: "asc",
        },
      },
      services: {
        where: {
          deletedAt: null,
        },
      },
    },
  });
  return barbershop;
};

export const getBarbershopBySlug = async (slug: string) => {
  const barbershop = await prisma.barbershop.findUnique({
    where: { slug },
    include: {
      barbers: {
        orderBy: {
          name: "asc",
        },
      },
      services: {
        where: {
          deletedAt: null,
        },
      },
    },
  });
  return barbershop;
};

export const getBarbershopsByServiceName = async (serviceName: string) => {
  const barbershops = await prisma.barbershop.findMany({
    where: {
      showInDirectory: true,
      services: {
        some: {
          deletedAt: null,
          name: {
            contains: serviceName,
            mode: "insensitive",
          },
        },
      },
    },
  });
  return barbershops;
};

export const getAdminBarbershopByUserId = async (userId: string) => {
  const ownedBarbershop = await prisma.barbershop.findFirst({
    where: {
      ownerId: userId,
    },
    select: {
      id: true,
    },
  });

  if (!ownedBarbershop) {
    return null;
  }

  try {
    await reconcilePendingBookingsForBarbershop(ownedBarbershop.id);
  } catch (error) {
    console.error(
      "[getAdminBarbershopByUserId] Failed to reconcile pending bookings for barbershop.",
      {
        error,
        userId,
        barbershopId: ownedBarbershop.id,
      },
    );
  }

  const barbershop = await prisma.barbershop.findUnique({
    where: {
      id: ownedBarbershop.id,
    },
    include: {
      barbers: {
        orderBy: {
          name: "asc",
        },
      },
      services: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          name: "asc",
        },
      },
      openingHours: {
        orderBy: {
          dayOfWeek: "asc",
        },
      },
      bookings: {
        where: {
          OR: [
            CONFIRMED_BOOKING_PAYMENT_WHERE,
            {
              cancelledAt: {
                not: null,
              },
            },
          ],
        },
        include: {
          barber: true,
          service: true,
          services: {
            include: {
              service: true,
            },
          },
          user: true,
        },
        orderBy: {
          date: "desc",
        },
      },
    },
  });
  return barbershop;
};

export const getAdminBarbershopIdByUserId = async (userId: string) => {
  const barbershop = await prisma.barbershop.findFirst({
    where: {
      ownerId: userId,
    },
    select: {
      id: true,
    },
  });

  return barbershop;
};
