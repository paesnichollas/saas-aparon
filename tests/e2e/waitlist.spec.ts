import { expect, test } from "@playwright/test";

import { loginWithPhoneApi } from "./fixtures/auth";
import {
  countActiveWaitlistEntriesForUser,
  createWaitlistEntryForUser,
  findUserIdByPhone,
} from "./fixtures/db";
import { TEST_BARBERSHOPS, TEST_DATES, TEST_IDS } from "./fixtures/test-data";

test.describe("waitlist", () => {
  test("happy: active waitlist entry is visible on bookings page", async ({ page }) => {
    const phoneDigits = "11981000015";

    await loginWithPhoneApi({
      page,
      name: "Waitlist Happy",
      phoneDigits,
      callbackPath: "/",
    });

    const userId = await findUserIdByPhone(phoneDigits);

    await createWaitlistEntryForUser({
      userId,
      dateDay: new Date(`${TEST_DATES.fullyBookedDayIso}T00:00:00.000Z`),
    });

    await page.goto("/bookings");

    await expect(page.getByTestId("waitlist-list").first()).toBeVisible();
    await expect(page.getByTestId("waitlist-entry-barbershop-name").first()).toHaveText(
      TEST_BARBERSHOPS.public.name,
    );
    await expect(page.getByTestId("waitlist-entry-status-active").first()).toBeVisible();
  });

  test("failure/rule: empty waitlist state is rendered", async ({ page }) => {
    await loginWithPhoneApi({
      page,
      name: "Waitlist Empty",
      phoneDigits: "11981000016",
      callbackPath: "/",
    });

    await page.goto("/bookings");

    await expect(page.getByTestId("waitlist-empty-state").first()).toHaveText(
      /Voce nao possui entradas na fila de espera/i,
    );
  });

  test("rule: join waitlist is blocked when day still has available slots", async ({ page }) => {
    const phoneDigits = "11981000020";

    await loginWithPhoneApi({
      page,
      name: "Waitlist Available Day",
      phoneDigits,
      callbackPath: "/",
    });

    const userId = await findUserIdByPhone(phoneDigits);

    const joinResponse = await page.request.post("/api/waitlist", {
      data: {
        barbershopId: TEST_IDS.barbershopPublic,
        barberId: TEST_IDS.barberPublicPrimary,
        serviceId: TEST_IDS.serviceCut,
        dateDay: TEST_DATES.availableDayIso,
      },
    });

    expect(joinResponse.status()).toBe(400);

    const joinResponseJson = (await joinResponse.json()) as { error?: string };
    expect(joinResponseJson.error ?? "").toMatch(/Ainda ha horarios disponiveis/i);

    const activeEntryCount = await countActiveWaitlistEntriesForUser({
      userId,
      dateDay: TEST_DATES.availableDayIso,
      barbershopId: TEST_IDS.barbershopPublic,
      barberId: TEST_IDS.barberPublicPrimary,
      serviceId: TEST_IDS.serviceCut,
    });

    expect(activeEntryCount).toBe(0);
  });
});
