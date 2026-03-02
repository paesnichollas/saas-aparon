import { expect, test } from "@playwright/test";

import { loginWithPhoneApi } from "./fixtures/auth";

test("logout: menu redirects immediately and protected routes require auth", async ({
  page,
}) => {
  await loginWithPhoneApi({
    page,
    name: "Logout Immediate",
    phoneDigits: "11981000018",
    callbackPath: "/",
  });

  await expect(page.getByTestId("menu-open")).toBeVisible();
  await page.getByTestId("menu-open").click();

  const logoutButton = page.getByTestId("menu-logout");
  await expect(logoutButton).toBeVisible();
  await logoutButton.click();

  await expect(page).toHaveURL(/\/auth\?forceLogin=1$/, { timeout: 1_000 });
  await expect(page.getByTestId("auth-submit")).toBeVisible();

  await expect(async () => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/auth\?callbackUrl=%2Fprofile/);
  }).toPass({
    timeout: 10_000,
  });
});
