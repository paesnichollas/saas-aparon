import { expect, test } from "@playwright/test";

import { loginWithPhoneApi } from "./fixtures/auth";
import { setUserRoleByPhone } from "./fixtures/db";
import { TEST_IDS } from "./fixtures/test-data";

test.describe("owner reports", () => {
  test("happy: owner metrics load for selected period", async ({ page }) => {
    const ownerPhone = "11981000009";

    await loginWithPhoneApi({
      page,
      name: "Owner Reports",
      phoneDigits: ownerPhone,
      callbackPath: "/",
    });

    await setUserRoleByPhone({
      phoneDigits: ownerPhone,
      role: "OWNER",
      barbershopId: TEST_IDS.barbershopPublic,
    });

    await page.goto("/owner/reports");

    await expect(page.getByTestId("owner-reports-card").first()).toBeVisible();
    await expect(page.getByTestId("owner-report-year").first()).toBeVisible();
    await expect(page.getByTestId("owner-report-month").first()).toBeVisible();
    await expect(page.getByTestId("owner-report-kpis").first()).toBeVisible();
  });

  test("failure: owner without barbershop sees blocked state", async ({ page }) => {
    const ownerPhone = "11981000019";

    await loginWithPhoneApi({
      page,
      name: "Owner Reports Missing",
      phoneDigits: ownerPhone,
      callbackPath: "/",
    });

    await setUserRoleByPhone({
      phoneDigits: ownerPhone,
      role: "OWNER",
      barbershopId: null,
    });

    await page.goto("/owner/reports");

    await expect(page.getByText(/Nenhuma barbearia vinculada/i).first()).toBeVisible();
  });
});
