import { expect, test } from "@playwright/test";

import { loginWithPhoneUi } from "./fixtures/auth";

test.describe("auth/profile", () => {
  test("happy: phone login succeeds and lands on authenticated home", async ({
    page,
  }) => {
    await loginWithPhoneUi({
      page,
      name: "Auth Happy",
      phoneDigits: "11981000001",
      callbackPath: "/",
    });

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("quick-search-input")).toBeVisible();
  });

  test("failure: phone login with mismatched existing identity returns conflict", async ({
    page,
    request,
  }) => {
    const seedResponse = await request.post("/api/auth/phone", {
      data: {
        name: "Conflict Name",
        phone: "11981000002",
        callbackUrl: "/",
      },
    });

    expect(seedResponse.ok()).toBeTruthy();

    await page.context().clearCookies();
    await page.goto("/auth?callbackUrl=%2F");
    await page.getByTestId("auth-name-input").fill("Another Name");
    await page.getByTestId("auth-phone-input").fill("11981000002");
    await page.getByTestId("auth-submit").click();

    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByTestId("quick-search-input")).toHaveCount(0);
  });
});
