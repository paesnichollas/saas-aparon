import { expect, test } from "@playwright/test";

import { loginWithPhoneApi } from "./fixtures/auth";
import { setUserRoleByPhone } from "./fixtures/db";
import { TEST_IDS } from "./fixtures/test-data";

test.describe("admin flows", () => {
  test("happy + failure: admin role management and invalid promotion", async ({ page }) => {
    const adminPhone = "11981000010";

    await loginWithPhoneApi({
      page,
      name: "Admin Flow",
      phoneDigits: adminPhone,
      callbackPath: "/",
    });

    await setUserRoleByPhone({
      phoneDigits: adminPhone,
      role: "ADMIN",
      barbershopId: null,
    });

    await page.goto("/admin/owners");

    await page
      .getByTestId(`admin-set-role-admin-${TEST_IDS.userCustomerOne}`)
      .click();
    await expect(
      page.getByTestId(`admin-set-role-customer-${TEST_IDS.userCustomerOne}`),
    ).toBeVisible();

    await page
      .getByTestId(`admin-promote-owner-${TEST_IDS.userCustomerTwo}`)
      .click();
    await expect(
      page.getByText(/Informe a barbearia para promover o usu[aá]rio a owner/i),
    ).toBeVisible();
  });
});
