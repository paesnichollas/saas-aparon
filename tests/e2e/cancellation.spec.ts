import { expect, test } from "@playwright/test";

import { loginWithPhoneApi } from "./fixtures/auth";
import { TEST_DATES, TEST_IDS } from "./fixtures/test-data";

test.describe("booking/cancellation", () => {
  test("happy: cancel future booking and reflect status", async ({ page }) => {
    await loginWithPhoneApi({
      page,
      name: "Cancel Happy",
      phoneDigits: "11981000007",
      callbackPath: "/",
    });

    const createResponse = await page.request.post("/api/bookings", {
      data: {
        barbershopId: TEST_IDS.barbershopPublic,
        serviceId: TEST_IDS.serviceBeard,
        barberId: TEST_IDS.barberPublicPrimary,
        date: `${TEST_DATES.availableDayIso}T13:00:00.000Z`,
      },
    });

    expect(createResponse.status()).toBe(201);

    const responseJson = (await createResponse.json()) as { bookingId: string };

    await page.goto("/bookings");
    await page.getByTestId(`booking-item-${responseJson.bookingId}`).first().click();

    await page.getByTestId("booking-cancel-open").click();
    await page.getByTestId("booking-cancel-confirm").click();

    await expect(page.getByText(/Agendamento cancelado com sucesso/i)).toBeVisible();

    await page.goto("/bookings");
    await expect(page.getByText(/CANCELADO/i).first()).toBeVisible();
  });

  test("rule: repeated cancellation is blocked", async ({ page }) => {
    await loginWithPhoneApi({
      page,
      name: "Cancel Rule",
      phoneDigits: "11981000018",
      callbackPath: "/",
    });

    const createResponse = await page.request.post("/api/bookings", {
      data: {
        barbershopId: TEST_IDS.barbershopPublic,
        serviceId: TEST_IDS.serviceBeard,
        barberId: TEST_IDS.barberPublicPrimary,
        date: `${TEST_DATES.availableDayIso}T14:00:00.000Z`,
      },
    });

    expect(createResponse.status()).toBe(201);

    const createJson = (await createResponse.json()) as { bookingId: string };

    const firstCancelResponse = await page.request.post(
      `/api/bookings/${createJson.bookingId}/cancel`,
    );
    expect(firstCancelResponse.status()).toBe(200);

    const secondCancelResponse = await page.request.post(
      `/api/bookings/${createJson.bookingId}/cancel`,
    );
    expect(secondCancelResponse.status()).toBe(400);

    const secondCancelJson = (await secondCancelResponse.json()) as {
      error?: string;
    };
    expect(secondCancelJson.error ?? "").toMatch(/ja foi cancelado|j[aá] foi cancelado/i);
  });
});
