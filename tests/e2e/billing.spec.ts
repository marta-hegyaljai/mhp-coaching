import {expect, test} from "@playwright/test";

import {credentials, replaySession} from "./helpers/session";

const therapistEmail = credentials.therapist.email;

test.describe("current-month usage and discounts", () => {
  test.describe.configure({mode: "serial"});

  test.describe("as the therapist", () => {
    replaySession("therapist");

    test("therapist sees an open, not-finalized usage page in EN and FR", async ({
      page,
    }) => {
      await page.goto("/en/billing");
      await expect(page.getByRole("heading", {name: "Billing"})).toBeVisible();
      await expect(page.getByRole("heading", {name: "All months"})).toBeVisible();
      await expect(page.getByRole("heading", {name: "Payment method"})).toBeVisible();

      const addCard = page.getByRole("button", {name: "Add a payment method"});
      if (await addCard.isVisible()) {
        await expect(page.getByText("No card on file")).toBeVisible();
        await addCard.click();
        await expect(page.getByRole("heading", {name: "Save a test card"})).toBeVisible();
        await page.getByRole("button", {name: "Save this test card"}).click();
        await expect(page).toHaveURL(/\/en\/billing/);
      }

      await expect(page.getByText("Visa •••• 4242")).toBeVisible();
      await expect(page.getByRole("button", {name: "Replace payment method"})).toBeVisible();

      await page.setViewportSize({width: 390, height: 844});
      await page.goto("/fr/facturation");
      await expect(page.getByRole("heading", {name: "Facturation"})).toBeVisible();
      await expect(page.getByRole("heading", {name: "Tous les mois"})).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });

  test.describe("as an admin", () => {
    replaySession("admin");

    test("admin can set a discount and open current-month billing", async ({page}) => {
      await page.goto("/en/admin/users");
      await page.getByLabel("Search").fill(therapistEmail);
      await page.getByRole("button", {name: "Show"}).click();
      await expect(page.getByText(therapistEmail)).toBeVisible();
      await page.getByRole("link", {name: "Manage"}).first().click();
      await expect(page.getByRole("heading", {name: "Room discount"})).toBeVisible();
      await page.getByLabel("Discount (%)").fill("10");
      await page.getByRole("button", {name: "Save discount"}).click();
      await expect(page.getByText("Discount updated. Existing bookings are unchanged.")).toBeVisible();

      await page.goto("/en/admin/billing");
      await expect(page.getByRole("heading", {name: "Current month usage"})).toBeVisible();
      await expect(page.getByText("Open — not finalized")).toBeVisible();
      await expect(page.getByRole("heading", {name: "Billing period"})).toBeVisible();
      await expect(page.locator("#billing-from")).toBeVisible();
      await expect(page.locator("#billing-to")).toBeVisible();
      await expect(page.getByRole("button", {name: "Show period"})).toBeVisible();
      await expect(page.getByRole("link", {name: "This year"})).toBeVisible();
      await expect(page.getByRole("link", {name: "Last 12 months"})).toBeVisible();
      await expect(page.getByRole("link", {name: "Download Excel workbook"})).toBeVisible();
      await page.getByLabel("Search therapists").fill(therapistEmail);
      await page.getByRole("button", {name: "Show", exact: true}).click();
      await expect(page.getByText(therapistEmail)).toBeVisible();
      await page.getByRole("link", {name: therapistEmail}).click();
      await expect(page.getByRole("heading", {name: "User usage"})).toBeVisible();
      await expect(page.getByRole("button", {name: "Finalize this month"})).toBeDisabled();
      await page.getByRole("link", {name: /Closed August 2026/i}).click();
      await expect(page.getByText("Closed month", {exact: true}).first()).toBeVisible();
      await expect(page.getByText(/already finalized/i)).toBeVisible();
      await expect(page.getByRole("button", {name: "Finalize this month"})).toBeDisabled();
      await page.getByRole("link", {name: /Paid August 2026/i}).click();
      await expect(page.getByText("Paid", {exact: true}).first()).toBeVisible();
      await expect(page.getByRole("button", {name: "Charge now"})).toHaveCount(0);
      await expect(page.getByRole("button", {name: "Retry charge"})).toHaveCount(0);
      await expect(page.getByRole("heading", {name: "Notification evidence"})).toBeVisible();

      await page.goto("/en/admin/billing");
      await expect(page.getByRole("link", {name: "Notification evidence"})).toBeVisible();
      await page.getByRole("link", {name: "Notification evidence"}).click();
      await expect(page).toHaveURL(/\/en\/admin\/notifications/);
      await expect(page.getByRole("heading", {name: "Notification evidence"})).toBeVisible();
      await expect(page.getByText("Statement finalized")).toBeVisible();
      await expect(page.getByText("Payment succeeded")).toBeVisible();
      await expect(page.getByText("Sent").first()).toBeVisible();
      await page.setViewportSize({width: 390, height: 844});
      await expect(page.getByRole("heading", {name: "Notification evidence"})).toBeVisible();
    });
  });
});
