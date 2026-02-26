import { expect, test } from "@playwright/test";

import { createShareLinkToken } from "@/lib/share-link-token";
import { loginWithPhoneApi } from "./fixtures/auth";
import {
  findUserIdByPhone,
  getCurrentBarbershopIdByUserId,
  hasCustomerBarbershopLink,
} from "./fixtures/db";
import { TEST_BARBERSHOPS, TEST_IDS } from "./fixtures/test-data";

test("share-link: invalid token falls back safely", async ({ page }) => {
  await page.goto(`/s/${TEST_BARBERSHOPS.public.publicSlug}?st=invalid-token`);

  await expect(page).toHaveURL(/\/auth\?callbackUrl=%2F/);
});

test("share-link: valid token links customer after auth", async ({ page }) => {
  const phoneDigits = "11981000017";
  const shareToken = createShareLinkToken({
    barbershopId: TEST_IDS.barbershopPublic,
    publicSlug: TEST_BARBERSHOPS.public.publicSlug,
  });

  await page.goto(
    `/s/${TEST_BARBERSHOPS.public.publicSlug}?st=${encodeURIComponent(shareToken)}`,
  );
  await expect(page).toHaveURL(/\/auth\?callbackUrl=%2F/);

  await loginWithPhoneApi({
    page,
    name: "Share Link Happy",
    phoneDigits,
    callbackPath: "/",
  });

  await page.goto(
    `/s/${TEST_BARBERSHOPS.public.publicSlug}?st=${encodeURIComponent(shareToken)}`,
  );

  const userId = await findUserIdByPhone(phoneDigits);

  await expect
    .poll(async () => {
      return hasCustomerBarbershopLink({
        userId,
        barbershopId: TEST_IDS.barbershopPublic,
      });
    }, {
      timeout: 20_000,
    })
    .toBe(true);

  await expect
    .poll(async () => {
      return getCurrentBarbershopIdByUserId(userId);
    }, {
      timeout: 20_000,
    })
    .toBe(TEST_IDS.barbershopPublic);
});
