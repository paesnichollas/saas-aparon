import { expect, test } from "@playwright/test";

import { loginWithPhoneApi } from "./fixtures/auth";
import { TEST_BARBERSHOPS } from "./fixtures/test-data";

test.describe("home/search/detail", () => {
  test("happy: search by barbershop name returns matching result", async ({
    page,
  }) => {
    await loginWithPhoneApi({
      page,
      name: "Search By Name",
      phoneDigits: "11981000023",
      callbackPath: "/",
    });

    await expect(page.getByTestId("quick-search-input")).toBeVisible();

    await page
      .getByTestId("quick-search-input")
      .fill("test shop");
    await page.getByTestId("quick-search-submit").click();

    await expect(page).toHaveURL(/\/barbershops\?search=/i);
    await expect(
      page.getByTestId(`barbershop-card-${TEST_BARBERSHOPS.public.slug}`),
    ).toBeVisible();
  });

  test("happy: search by service accepts accents and case variations", async ({
    page,
  }) => {
    await loginWithPhoneApi({
      page,
      name: "Search By Service",
      phoneDigits: "11981000003",
      callbackPath: "/",
    });

    await expect(page.getByTestId("quick-search-input")).toBeVisible();

    await page.getByTestId("quick-search-input").fill("CÓrTe");
    await page.getByTestId("quick-search-submit").click();

    await expect(page).toHaveURL(/\/barbershops\?search=/i);

    await page.getByTestId(`barbershop-card-${TEST_BARBERSHOPS.public.slug}`).click();

    await expect(page).toHaveURL(new RegExp(`/b/${TEST_BARBERSHOPS.public.slug}`));
    await expect(page.getByText(TEST_BARBERSHOPS.public.name)).toBeVisible();
  });

  test("failure: exclusive barbershop is not returned in global search", async ({
    page,
  }) => {
    await loginWithPhoneApi({
      page,
      name: "Search Exclusive",
      phoneDigits: "11981000033",
      callbackPath: "/",
    });

    await page.goto("/barbershops?search=exclusive");

    await expect(page.getByText(/Nenhuma barbearia encontrada/i).first()).toBeVisible();
    await expect(
      page.getByTestId(`barbershop-card-${TEST_BARBERSHOPS.exclusive.slug}`),
    ).toHaveCount(0);
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
