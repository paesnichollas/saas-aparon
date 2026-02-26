import { expect, test } from "@playwright/test";

import { loginWithPhoneApi } from "./fixtures/auth";
import { assignOwnerByPhone } from "./fixtures/db";
import { TEST_IDS } from "./fixtures/test-data";

test.describe("owner flows", () => {
  test("happy + failure: owner can create service and sees validation feedback", async ({
    page,
  }) => {
    const ownerPhone = "11981000021";

    await loginWithPhoneApi({
      page,
      name: "Owner Manage",
      phoneDigits: ownerPhone,
      callbackPath: "/owner",
    });

    await assignOwnerByPhone({
      phoneDigits: ownerPhone,
      barbershopId: TEST_IDS.barbershopExclusive,
    });

    await page.goto("/owner");

    const saveServiceButton = page
      .locator('[data-testid="owner-save-service"]:visible')
      .first();
    const serviceNameInput = page
      .locator('[data-testid="owner-service-name-input"]:visible')
      .first();
    const servicePriceInput = page
      .locator('[data-testid="owner-service-price-input"]:visible')
      .first();

    await page.getByTestId("owner-new-service").click();
    await saveServiceButton.click({ force: true });

    await serviceNameInput.fill("Servico E2E");
    await servicePriceInput.fill("49,90");
    await servicePriceInput.press("Enter");

    await expect(page.getByText(/criado com sucesso/i)).toBeVisible();
  });
});
