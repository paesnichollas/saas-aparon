import { expect, type Page } from "@playwright/test";

type LoginWithPhoneInput = {
  page: Page;
  name: string;
  phoneDigits: string;
  callbackPath?: string;
};

const getAuthCallbackPath = (callbackPath: string) => {
  return `/auth/callback?callbackUrl=${encodeURIComponent(callbackPath)}`;
};

export const loginWithPhoneApi = async ({
  page,
  name,
  phoneDigits,
  callbackPath = "/",
}: LoginWithPhoneInput) => {
  const response = await page.request.post("/api/auth/phone", {
    data: {
      name,
      phone: phoneDigits,
      callbackUrl: callbackPath,
    },
  });

  expect(response.ok()).toBeTruthy();

  await page.goto(getAuthCallbackPath(callbackPath));
  await page.waitForURL((url) => {
    return url.pathname === callbackPath;
  });
};

export const loginWithPhoneUi = async ({
  page,
  name,
  phoneDigits,
  callbackPath = "/",
}: LoginWithPhoneInput) => {
  const targetAuthUrl = `/auth?callbackUrl=${encodeURIComponent(callbackPath)}`;
  await page.goto(targetAuthUrl);

  await page.getByTestId("auth-name-input").fill(name);
  await page.getByTestId("auth-phone-input").fill(phoneDigits);
  await page.getByTestId("auth-submit").click();

  await page.waitForURL((url) => {
    return url.pathname !== "/auth" && url.pathname !== "/auth/callback";
  });
};
