import { prisma } from "@/lib/prisma";

export const getAppConfig = async () => {
  const appConfig = await prisma.appConfig.upsert({
    where: {
      id: "app",
    },
    create: {
      id: "app",
    },
    update: {},
  });

  return appConfig;
};

export const getExclusiveBarbershop = async () => {
  const appConfig = await getAppConfig();

  if (!appConfig.exclusiveBarbershopId) {
    return null;
  }

  const exclusiveBarbershop = await prisma.barbershop.findUnique({
    where: {
      id: appConfig.exclusiveBarbershopId,
    },
    include: {
      openingHours: {
        orderBy: {
          dayOfWeek: "asc",
        },
      },
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
    },
  });

  return exclusiveBarbershop;
};
