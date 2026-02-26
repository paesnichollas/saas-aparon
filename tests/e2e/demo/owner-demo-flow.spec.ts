import { expect, test } from "@playwright/test";

import { loginWithPhoneApi } from "../fixtures/auth";
import { assignOwnerByPhone } from "../fixtures/db";
import { TEST_DATES, TEST_IDS } from "../fixtures/test-data";

test("demo: customer booking appears in owner agenda and cancellation reflects back", async ({
  browser,
}) => {
  const customerContext = await browser.newContext();
  const customerPage = await customerContext.newPage();

  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();

  const customerPhone = "11981000011";
  const ownerPhone = "11981000012";

  let bookingId = "";

  await test.step("customer creates a booking", async () => {
    await loginWithPhoneApi({
      page: customerPage,
      name: "Demo Customer",
      phoneDigits: customerPhone,
      callbackPath: "/",
    });

    const createResponse = await customerPage.request.post("/api/bookings", {
      data: {
        barbershopId: TEST_IDS.barbershopPublic,
        serviceId: TEST_IDS.serviceCut,
        barberId: TEST_IDS.barberPublicPrimary,
        date: `${TEST_DATES.availableDayIso}T15:00:00.000Z`,
      },
    });

    expect(createResponse.status()).toBe(201);

    const createResponseJson = (await createResponse.json()) as {
      bookingId: string;
    };
    bookingId = createResponseJson.bookingId;
  });

  await test.step("owner sees booking in agenda", async () => {
    await loginWithPhoneApi({
      page: ownerPage,
      name: "Demo Owner",
      phoneDigits: ownerPhone,
      callbackPath: "/bookings",
    });

    await assignOwnerByPhone({
      phoneDigits: ownerPhone,
      barbershopId: TEST_IDS.barbershopPublic,
    });

    await ownerPage.goto("/bookings");
    await expect(ownerPage.getByTestId(`owner-booking-${bookingId}`).first()).toBeVisible();
  });

  await test.step("customer cancels the booking", async () => {
    await customerPage.goto("/bookings");
    await customerPage.getByTestId(`booking-item-${bookingId}`).first().click();
    await customerPage.getByTestId("booking-cancel-open").click();
    await customerPage.getByTestId("booking-cancel-confirm").click();

    await expect(
      customerPage.getByText(/Agendamento cancelado com sucesso/i),
    ).toBeVisible();
  });

  await test.step("owner sees canceled status after refresh", async () => {
    await expect
      .poll(
        async () => {
          await ownerPage.goto("/bookings");
          const bookingCard = ownerPage.getByTestId(`owner-booking-${bookingId}`);

          if ((await bookingCard.count()) === 0) {
            return "";
          }

          return (await bookingCard.first().textContent()) ?? "";
        },
        {
          timeout: 20_000,
        },
      )
      .toMatch(/CANCELAD[AO]/i);
  });

  await ownerContext.close();
  await customerContext.close();
});
