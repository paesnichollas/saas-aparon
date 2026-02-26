import { expect, test } from "@playwright/test";

import { loginWithPhoneApi } from "./fixtures/auth";
import { TEST_DATES, TEST_IDS } from "./fixtures/test-data";

test("booking conflict: second user receives conflict for same slot", async ({ browser }) => {
  const firstContext = await browser.newContext();
  const firstPage = await firstContext.newPage();

  await loginWithPhoneApi({
    page: firstPage,
    name: "Conflict First",
    phoneDigits: "11981000005",
    callbackPath: "/",
  });

  const firstCreateResponse = await firstPage.request.post("/api/bookings", {
    data: {
      barbershopId: TEST_IDS.barbershopPublic,
      serviceId: TEST_IDS.serviceCut,
      barberId: TEST_IDS.barberPublicPrimary,
      date: `${TEST_DATES.availableDayIso}T12:00:00.000Z`,
    },
  });

  expect(firstCreateResponse.status()).toBe(201);

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();

  await loginWithPhoneApi({
    page: secondPage,
    name: "Conflict Second",
    phoneDigits: "11981000006",
    callbackPath: "/",
  });

  const secondCreateResponse = await secondPage.request.post("/api/bookings", {
    data: {
      barbershopId: TEST_IDS.barbershopPublic,
      serviceId: TEST_IDS.serviceCut,
      barberId: TEST_IDS.barberPublicPrimary,
      date: `${TEST_DATES.availableDayIso}T12:00:00.000Z`,
    },
  });

  expect(secondCreateResponse.status()).toBe(409);
  await expect(secondCreateResponse.json()).resolves.toEqual(
    expect.objectContaining({
      error: expect.stringMatching(/agendad|ocupad/i),
    }),
  );

  await secondContext.close();
  await firstContext.close();
});
