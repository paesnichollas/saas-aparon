import { expect, test } from "@playwright/test";

import { loginWithPhoneApi } from "./fixtures/auth";
import { TEST_BARBERSHOPS } from "./fixtures/test-data";

test.describe("home/search/detail", () => {
  test("happy: barbershops render and detail opens", async ({ page }) => {
    await loginWithPhoneApi({
      page,
      name: "Search Happy",
      phoneDigits: "11981000003",
      callbackPath: "/",
    });

    await expect(page.getByTestId("quick-search-input")).toBeVisible();

    await page.getByTestId("quick-search-input").fill("corte");
    await page.getByTestId("quick-search-submit").click();

    await expect(page).toHaveURL(/\/barbershops\?search=corte/i);

    await page.getByTestId(`barbershop-card-${TEST_BARBERSHOPS.public.slug}`).click();

    await expect(page).toHaveURL(new RegExp(`/b/${TEST_BARBERSHOPS.public.slug}`));
    await expect(page.getByText(TEST_BARBERSHOPS.public.name)).toBeVisible();
  });

  test("failure: unmatched search term shows empty state", async ({ page }) => {
    await loginWithPhoneApi({
      page,
      name: "Search Empty",
      phoneDigits: "11981000013",
      callbackPath: "/",
    });

    await page.goto("/barbershops?search=sem-resultado-e2e");

    await expect(page.getByText(/Nenhuma barbearia encontrada/i).first()).toBeVisible();
  });
});
