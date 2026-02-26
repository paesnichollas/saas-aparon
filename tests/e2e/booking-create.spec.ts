import { expect, test } from "@playwright/test";

import { loginWithPhoneApi } from "./fixtures/auth";
import { TEST_DATES, TEST_IDS } from "./fixtures/test-data";

test.describe("booking/create", () => {
  test("happy: create booking via API and validate booking in UI", async ({ page }) => {
    await loginWithPhoneApi({
      page,
      name: "Booking Happy",
      phoneDigits: "11981000004",
      callbackPath: "/",
    });

    const createResponse = await page.request.post("/api/bookings", {
      data: {
        barbershopId: TEST_IDS.barbershopPublic,
        serviceId: TEST_IDS.serviceCut,
        barberId: TEST_IDS.barberPublicPrimary,
        date: `${TEST_DATES.availableDayIso}T11:00:00.000Z`,
      },
    });

    expect(createResponse.status()).toBe(201);

    const responseJson = (await createResponse.json()) as { bookingId: string };

    await page.goto("/bookings");
    await expect(
      page.getByTestId(`booking-item-${responseJson.bookingId}`).first(),
    ).toBeVisible();
  });

  test("failure: invalid payload is blocked", async ({ page }) => {
    await loginWithPhoneApi({
      page,
      name: "Booking Invalid",
      phoneDigits: "11981000014",
      callbackPath: "/",
    });

    const invalidResponse = await page.request.post("/api/bookings", {
      data: {
        barbershopId: TEST_IDS.barbershopPublic,
        barberId: TEST_IDS.barberPublicPrimary,
        date: `${TEST_DATES.availableDayIso}T11:30:00.000Z`,
      },
    });

    expect(invalidResponse.status()).toBe(400);
  });
});
