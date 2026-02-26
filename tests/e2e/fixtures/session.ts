import { expect, type Page } from "@playwright/test";

export const expectAuthenticatedShell = async (page: Page) => {
  await expect(page.getByTestId("menu-open")).toBeVisible();
};
