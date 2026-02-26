import { expect, test } from "@playwright/test";

import { loginWithPhoneApi } from "./fixtures/auth";
import { createFinishedBookingForUser, findUserIdByPhone } from "./fixtures/db";
import { TEST_DATES } from "./fixtures/test-data";

test.describe("booking/review", () => {
  test("happy + rule: finished paid booking can be reviewed once", async ({ page }) => {
    const phoneDigits = "11981000008";

    await loginWithPhoneApi({
      page,
      name: "Review Happy",
      phoneDigits,
      callbackPath: "/",
    });

    const userId = await findUserIdByPhone(phoneDigits);
    const finishedStartAt = new Date(TEST_DATES.finishedBookingStartAtIso);
    const finishedEndAt = new Date(TEST_DATES.finishedBookingEndAtIso);

    const bookingId = await createFinishedBookingForUser({
      userId,
      startAt: finishedStartAt,
      endAt: finishedEndAt,
    });

    await page.goto("/bookings");
    await page.getByTestId(`booking-item-${bookingId}`).first().click();

    await page.getByTestId("booking-review-open").click();
    await page.getByTestId("booking-review-star-5").click();
    await page.getByTestId("booking-review-submit").click();

    await expect(page.getByRole("button", { name: /Avaliado/i })).toBeVisible();
    await expect(page.getByTestId("booking-review-open")).toHaveCount(0);
  });
});

