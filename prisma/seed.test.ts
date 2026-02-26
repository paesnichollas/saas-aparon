import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import {
  TEST_BARBERSHOPS,
  TEST_BOOKING_WINDOW,
  TEST_DATES,
  TEST_IDS,
  TEST_USERS,
} from "../tests/e2e/fixtures/test-data";

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed test data.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const TEST_OPENING_HOURS = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  openMinute: TEST_BOOKING_WINDOW.openHour * 60,
  closeMinute: TEST_BOOKING_WINDOW.closeHour * 60,
  closed: false,
}));

const toDateOnly = (isoDate: string) => {
  return new Date(`${isoDate}T00:00:00.000Z`);
};

const toDateTime = (isoDateTime: string) => {
  return new Date(isoDateTime);
};

const toDeterministicBookingId = (index: number) => {
  const suffix = (0x700 + index).toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${suffix}`;
};

const createFullyBookedSlots = () => {
  const slots: Array<{ startAt: Date; endAt: Date }> = [];
  const totalSlots =
    ((TEST_BOOKING_WINDOW.closeHour - TEST_BOOKING_WINDOW.openHour) * 60) /
    TEST_BOOKING_WINDOW.slotMinutes;

  for (let index = 0; index < totalSlots; index += 1) {
    const slotStartHour = TEST_BOOKING_WINDOW.openHour + index * 0.5;
    const wholeHour = Math.floor(slotStartHour);
    const minutes = slotStartHour % 1 === 0 ? 0 : 30;

    const startAt = new Date(
      `${TEST_DATES.fullyBookedDayIso}T${String(wholeHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00.000Z`,
    );
    const endAt = new Date(startAt.getTime() + TEST_BOOKING_WINDOW.slotMinutes * 60_000);

    slots.push({ startAt, endAt });
  }

  return slots;
};

const seedUsers = async () => {
  await prisma.user.upsert({
    where: { id: TEST_IDS.userOwner },
    update: {
      name: TEST_USERS.owner.name,
      email: TEST_USERS.owner.email,
      provider: "phone",
      phone: TEST_USERS.owner.phoneE164,
      role: "OWNER",
      isActive: true,
      profileCompleted: true,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    },
    create: {
      id: TEST_IDS.userOwner,
      name: TEST_USERS.owner.name,
      email: TEST_USERS.owner.email,
      provider: "phone",
      phone: TEST_USERS.owner.phoneE164,
      role: "OWNER",
      isActive: true,
      profileCompleted: true,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { id: TEST_IDS.userAdmin },
    update: {
      name: TEST_USERS.admin.name,
      email: TEST_USERS.admin.email,
      provider: "phone",
      phone: TEST_USERS.admin.phoneE164,
      role: "ADMIN",
      isActive: true,
      profileCompleted: true,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    },
    create: {
      id: TEST_IDS.userAdmin,
      name: TEST_USERS.admin.name,
      email: TEST_USERS.admin.email,
      provider: "phone",
      phone: TEST_USERS.admin.phoneE164,
      role: "ADMIN",
      isActive: true,
      profileCompleted: true,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { id: TEST_IDS.userCustomerOne },
    update: {
      name: TEST_USERS.customerOne.name,
      email: TEST_USERS.customerOne.email,
      provider: "phone",
      phone: TEST_USERS.customerOne.phoneE164,
      role: "CUSTOMER",
      isActive: true,
      profileCompleted: true,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    },
    create: {
      id: TEST_IDS.userCustomerOne,
      name: TEST_USERS.customerOne.name,
      email: TEST_USERS.customerOne.email,
      provider: "phone",
      phone: TEST_USERS.customerOne.phoneE164,
      role: "CUSTOMER",
      isActive: true,
      profileCompleted: true,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { id: TEST_IDS.userCustomerTwo },
    update: {
      name: TEST_USERS.customerTwo.name,
      email: TEST_USERS.customerTwo.email,
      provider: "phone",
      phone: TEST_USERS.customerTwo.phoneE164,
      role: "CUSTOMER",
      isActive: true,
      profileCompleted: true,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    },
    create: {
      id: TEST_IDS.userCustomerTwo,
      name: TEST_USERS.customerTwo.name,
      email: TEST_USERS.customerTwo.email,
      provider: "phone",
      phone: TEST_USERS.customerTwo.phoneE164,
      role: "CUSTOMER",
      isActive: true,
      profileCompleted: true,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    },
  });
};

const seedBarbershops = async () => {
  await prisma.barbershop.upsert({
    where: { id: TEST_IDS.barbershopPublic },
    update: {
      name: TEST_BARBERSHOPS.public.name,
      slug: TEST_BARBERSHOPS.public.slug,
      publicSlug: TEST_BARBERSHOPS.public.publicSlug,
      shareSlug: TEST_BARBERSHOPS.public.shareSlug,
      address: "Rua Publica 101, Centro",
      description: "Public barbershop used by deterministic e2e tests.",
      phones: ["(11) 99990-0001"],
      ownerId: TEST_IDS.userOwner,
      stripeEnabled: false,
      exclusiveBarber: false,
      isActive: true,
    },
    create: {
      id: TEST_IDS.barbershopPublic,
      name: TEST_BARBERSHOPS.public.name,
      slug: TEST_BARBERSHOPS.public.slug,
      publicSlug: TEST_BARBERSHOPS.public.publicSlug,
      shareSlug: TEST_BARBERSHOPS.public.shareSlug,
      address: "Rua Publica 101, Centro",
      description: "Public barbershop used by deterministic e2e tests.",
      phones: ["(11) 99990-0001"],
      ownerId: TEST_IDS.userOwner,
      stripeEnabled: false,
      exclusiveBarber: false,
      isActive: true,
    },
  });

  await prisma.barbershop.upsert({
    where: { id: TEST_IDS.barbershopExclusive },
    update: {
      name: TEST_BARBERSHOPS.exclusive.name,
      slug: TEST_BARBERSHOPS.exclusive.slug,
      publicSlug: TEST_BARBERSHOPS.exclusive.publicSlug,
      shareSlug: TEST_BARBERSHOPS.exclusive.shareSlug,
      address: "Avenida Exclusive 202, Centro",
      description: "Exclusive barbershop used by deterministic e2e tests.",
      phones: ["(11) 99990-0002"],
      stripeEnabled: false,
      exclusiveBarber: true,
      isActive: true,
    },
    create: {
      id: TEST_IDS.barbershopExclusive,
      name: TEST_BARBERSHOPS.exclusive.name,
      slug: TEST_BARBERSHOPS.exclusive.slug,
      publicSlug: TEST_BARBERSHOPS.exclusive.publicSlug,
      shareSlug: TEST_BARBERSHOPS.exclusive.shareSlug,
      address: "Avenida Exclusive 202, Centro",
      description: "Exclusive barbershop used by deterministic e2e tests.",
      phones: ["(11) 99990-0002"],
      stripeEnabled: false,
      exclusiveBarber: true,
      isActive: true,
    },
  });

  await prisma.user.update({
    where: {
      id: TEST_IDS.userOwner,
    },
    data: {
      barbershopId: TEST_IDS.barbershopPublic,
      currentBarbershopId: TEST_IDS.barbershopPublic,
    },
    select: {
      id: true,
    },
  });

  await prisma.user.updateMany({
    where: {
      id: {
        in: [TEST_IDS.userCustomerOne, TEST_IDS.userCustomerTwo],
      },
    },
    data: {
      currentBarbershopId: TEST_IDS.barbershopPublic,
    },
  });
};

const seedOpeningHours = async () => {
  await prisma.barbershopOpeningHours.deleteMany({
    where: {
      barbershopId: {
        in: [TEST_IDS.barbershopPublic, TEST_IDS.barbershopExclusive],
      },
    },
  });

  await prisma.barbershopOpeningHours.createMany({
    data: [TEST_IDS.barbershopPublic, TEST_IDS.barbershopExclusive].flatMap(
      (barbershopId) => {
        return TEST_OPENING_HOURS.map((openingHour) => ({
          barbershopId,
          dayOfWeek: openingHour.dayOfWeek,
          openMinute: openingHour.openMinute,
          closeMinute: openingHour.closeMinute,
          closed: openingHour.closed,
        }));
      },
    ),
  });
};

const seedBarbers = async () => {
  await prisma.barber.upsert({
    where: { id: TEST_IDS.barberPublicPrimary },
    update: {
      name: "Rafael Public",
      barbershopId: TEST_IDS.barbershopPublic,
    },
    create: {
      id: TEST_IDS.barberPublicPrimary,
      name: "Rafael Public",
      barbershopId: TEST_IDS.barbershopPublic,
    },
  });

  await prisma.barber.upsert({
    where: { id: TEST_IDS.barberPublicSecondary },
    update: {
      name: "Caio Public",
      barbershopId: TEST_IDS.barbershopPublic,
    },
    create: {
      id: TEST_IDS.barberPublicSecondary,
      name: "Caio Public",
      barbershopId: TEST_IDS.barbershopPublic,
    },
  });

  await prisma.barber.upsert({
    where: { id: TEST_IDS.barberExclusivePrimary },
    update: {
      name: "Exclusive Barber",
      barbershopId: TEST_IDS.barbershopExclusive,
    },
    create: {
      id: TEST_IDS.barberExclusivePrimary,
      name: "Exclusive Barber",
      barbershopId: TEST_IDS.barbershopExclusive,
    },
  });
};

const seedServices = async () => {
  await prisma.barbershopService.upsert({
    where: { id: TEST_IDS.serviceCut },
    update: {
      name: "Corte",
      description: "Corte social completo.",
      priceInCents: 5000,
      durationInMinutes: 30,
      barbershopId: TEST_IDS.barbershopPublic,
      deletedAt: null,
      isFeatured: true,
    },
    create: {
      id: TEST_IDS.serviceCut,
      name: "Corte",
      description: "Corte social completo.",
      priceInCents: 5000,
      durationInMinutes: 30,
      barbershopId: TEST_IDS.barbershopPublic,
      isFeatured: true,
    },
  });

  await prisma.barbershopService.upsert({
    where: { id: TEST_IDS.serviceBeard },
    update: {
      name: "Barba",
      description: "Alinhamento de barba.",
      priceInCents: 3500,
      durationInMinutes: 30,
      barbershopId: TEST_IDS.barbershopPublic,
      deletedAt: null,
      isFeatured: false,
    },
    create: {
      id: TEST_IDS.serviceBeard,
      name: "Barba",
      description: "Alinhamento de barba.",
      priceInCents: 3500,
      durationInMinutes: 30,
      barbershopId: TEST_IDS.barbershopPublic,
      isFeatured: false,
    },
  });

  await prisma.barbershopService.upsert({
    where: { id: TEST_IDS.serviceExclusive },
    update: {
      name: "Exclusive Cut",
      description: "Exclusive premium cut.",
      priceInCents: 9000,
      durationInMinutes: 45,
      barbershopId: TEST_IDS.barbershopExclusive,
      deletedAt: null,
      isFeatured: true,
    },
    create: {
      id: TEST_IDS.serviceExclusive,
      name: "Exclusive Cut",
      description: "Exclusive premium cut.",
      priceInCents: 9000,
      durationInMinutes: 45,
      barbershopId: TEST_IDS.barbershopExclusive,
      isFeatured: true,
    },
  });
};

const seedCustomerLinks = async () => {
  await prisma.customerBarbershop.createMany({
    data: [
      {
        customerId: TEST_IDS.userCustomerOne,
        barbershopId: TEST_IDS.barbershopPublic,
      },
      {
        customerId: TEST_IDS.userCustomerTwo,
        barbershopId: TEST_IDS.barbershopPublic,
      },
    ],
    skipDuplicates: true,
  });
};

const seedBookings = async () => {
  await prisma.booking.deleteMany({
    where: {
      OR: [
        {
          id: {
            in: [
              TEST_IDS.bookingFinishedReview,
              TEST_IDS.bookingUpcomingCancelable,
            ],
          },
        },
        {
          barbershopId: TEST_IDS.barbershopPublic,
          date: {
            gte: toDateOnly(TEST_DATES.fullyBookedDayIso),
            lt: new Date(`${TEST_DATES.fullyBookedDayIso}T23:59:59.999Z`),
          },
        },
      ],
    },
  });

  await prisma.booking.create({
    data: {
      id: TEST_IDS.bookingFinishedReview,
      barbershopId: TEST_IDS.barbershopPublic,
      barberId: TEST_IDS.barberPublicPrimary,
      serviceId: TEST_IDS.serviceCut,
      userId: TEST_IDS.userCustomerOne,
      paymentMethod: "IN_PERSON",
      paymentStatus: "PAID",
      totalDurationMinutes: 30,
      totalPriceInCents: 5000,
      startAt: toDateTime(TEST_DATES.finishedBookingStartAtIso),
      endAt: toDateTime(TEST_DATES.finishedBookingEndAtIso),
      date: toDateTime(TEST_DATES.finishedBookingStartAtIso),
      paymentConfirmedAt: toDateTime(TEST_DATES.finishedBookingEndAtIso),
      cancelledAt: null,
      services: {
        create: {
          serviceId: TEST_IDS.serviceCut,
        },
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: TEST_IDS.bookingUpcomingCancelable,
      barbershopId: TEST_IDS.barbershopPublic,
      barberId: TEST_IDS.barberPublicPrimary,
      serviceId: TEST_IDS.serviceBeard,
      userId: TEST_IDS.userCustomerOne,
      paymentMethod: "IN_PERSON",
      paymentStatus: "PAID",
      totalDurationMinutes: 30,
      totalPriceInCents: 3500,
      startAt: toDateTime(TEST_DATES.upcomingBookingStartAtIso),
      endAt: toDateTime(TEST_DATES.upcomingBookingEndAtIso),
      date: toDateTime(TEST_DATES.upcomingBookingStartAtIso),
      paymentConfirmedAt: toDateTime(TEST_DATES.upcomingBookingStartAtIso),
      cancelledAt: null,
      services: {
        create: {
          serviceId: TEST_IDS.serviceBeard,
        },
      },
    },
  });

  const fullyBookedSlots = createFullyBookedSlots();

  for (const [index, slot] of fullyBookedSlots.entries()) {
    await prisma.booking.create({
      data: {
        id: toDeterministicBookingId(index),
        barbershopId: TEST_IDS.barbershopPublic,
        barberId: TEST_IDS.barberPublicPrimary,
        serviceId: TEST_IDS.serviceCut,
        userId: TEST_IDS.userCustomerTwo,
        paymentMethod: "IN_PERSON",
        paymentStatus: "PAID",
        totalDurationMinutes: TEST_BOOKING_WINDOW.slotMinutes,
        totalPriceInCents: 5000,
        startAt: slot.startAt,
        endAt: slot.endAt,
        date: slot.startAt,
        paymentConfirmedAt: slot.startAt,
        cancelledAt: null,
        services: {
          create: {
            serviceId: TEST_IDS.serviceCut,
          },
        },
      },
    });
  }
};

const seed = async () => {
  await seedUsers();
  await seedBarbershops();
  await seedOpeningHours();
  await seedBarbers();
  await seedServices();
  await seedCustomerLinks();
  await seedBookings();

  await prisma.appConfig.upsert({
    where: { id: "app" },
    update: {},
    create: { id: "app" },
  });
};

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("[seed.test] failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
