export const TEST_IDS = {
  barbershopPublic: "00000000-0000-4000-8000-000000000101",
  barbershopExclusive: "00000000-0000-4000-8000-000000000102",
  barberPublicPrimary: "00000000-0000-4000-8000-000000000201",
  barberPublicSecondary: "00000000-0000-4000-8000-000000000202",
  barberExclusivePrimary: "00000000-0000-4000-8000-000000000203",
  serviceCut: "00000000-0000-4000-8000-000000000301",
  serviceBeard: "00000000-0000-4000-8000-000000000302",
  serviceExclusive: "00000000-0000-4000-8000-000000000303",
  userOwner: "00000000-0000-4000-8000-000000000401",
  userAdmin: "00000000-0000-4000-8000-000000000402",
  userCustomerOne: "00000000-0000-4000-8000-000000000403",
  userCustomerTwo: "00000000-0000-4000-8000-000000000404",
  bookingFinishedReview: "00000000-0000-4000-8000-000000000501",
  bookingUpcomingCancelable: "00000000-0000-4000-8000-000000000502",
};

export const TEST_USERS = {
  owner: {
    name: "Owner Test",
    phoneDigits: "11990000001",
    phoneE164: "+5511990000001",
    email: "owner.test@e2e.local",
  },
  admin: {
    name: "Admin Test",
    phoneDigits: "11990000002",
    phoneE164: "+5511990000002",
    email: "admin.test@e2e.local",
  },
  customerOne: {
    name: "Customer One",
    phoneDigits: "11990000003",
    phoneE164: "+5511990000003",
    email: "customer.one@e2e.local",
  },
  customerTwo: {
    name: "Customer Two",
    phoneDigits: "11990000004",
    phoneE164: "+5511990000004",
    email: "customer.two@e2e.local",
  },
};

export const TEST_BARBERSHOPS = {
  public: {
    name: "Public Test Shop",
    slug: "public-test-shop",
    publicSlug: "public-test-shop",
    shareSlug: "public-test-share",
  },
  exclusive: {
    name: "Exclusive Test Club",
    slug: "exclusive-test-club",
    publicSlug: "exclusive-test-club",
    shareSlug: "exclusive-test-share",
  },
};

export const TEST_DATES = {
  availableDayIso: "2035-06-18",
  fullyBookedDayIso: "2035-06-19",
  finishedBookingStartAtIso: "2024-01-15T14:00:00.000Z",
  finishedBookingEndAtIso: "2024-01-15T14:30:00.000Z",
  upcomingBookingStartAtIso: "2035-06-18T10:00:00.000Z",
  upcomingBookingEndAtIso: "2035-06-18T10:30:00.000Z",
};

export const TEST_BOOKING_WINDOW = {
  openHour: 9,
  closeHour: 17,
  slotMinutes: 30,
};
