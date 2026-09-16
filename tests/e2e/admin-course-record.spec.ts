import {expect, test} from "@playwright/test";

import {replaySession} from "./helpers/session";

const phone = {width: 390, height: 844};

replaySession("admin");

test("the course record has a visible way back to the catalogue list", async ({
  page,
}) => {
  await page.goto("/fr/admin/courses/advanced-techniques");
  const back = page.getByRole("link", {name: "Retour aux formations"});
  await expect(back).toBeVisible();
  await expect(back).toHaveClass(/border-ink/);
  await back.click();
  await expect(page).toHaveURL(/\/fr\/admin\/courses$/);
  await expect(page.getByRole("heading", {level: 1, name: "Formations"})).toBeVisible();

  await page.goto("/en/admin/courses/advanced-techniques");
  await expect(page.getByRole("link", {name: "Back to courses"})).toBeVisible();

  await page.setViewportSize(phone);
  await page.goto("/de/admin/courses/advanced-techniques");
  const deBack = page.getByRole("link", {name: "Zurück zu den Ausbildungen"});
  await expect(deBack).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await deBack.click();
  await expect(page).toHaveURL(/\/de\/admin\/courses$/);
});

test("staff can set course availability without a developer", async ({page}) => {
  await page.goto("/en/admin/courses/advanced-techniques?tab=details");

  const availability = page.getByLabel("Availability");
  await expect(availability).toBeVisible();
  await expect(availability).toHaveValue("auto");
  await expect(availability.locator("option")).toHaveText([
    "Automatic",
    "Available",
    "Full",
    "Dates pending",
    "Registration closed",
  ]);
});

test("session dates open the product calendar, not the native picker", async ({page}) => {
  await page.goto("/de/admin/courses/advanced-techniques?tab=sessions");
  await page.getByRole("button", {name: "Termin hinzufügen"}).click();

  const start = page.getByRole("button", {name: "Startdatum"});
  await start.click();

  const calendar = page.getByRole("dialog", {name: "Kalender"});
  await expect(calendar).toBeVisible();
  await expect(calendar.getByRole("button", {name: "Heute"})).toBeVisible();
  await expect(page.locator("input[type=date]")).toHaveCount(0);

  await calendar.getByRole("button", {name: /13/}).first().click();
  await expect(calendar).toHaveCount(0);
  await expect(start).toContainText("13");
});

test("an empty session can be deleted after a second confirmation", async ({page}) => {
  await page.goto("/en/admin/courses/stripe-payment-test?tab=sessions");
  await page.getByRole("button", {name: "Add a session"}).click();

  const start = page.getByRole("button", {name: "Start date"});
  await start.click();
  const calendar = page.getByRole("dialog", {name: "Calendar"});
  await calendar.getByLabel("Year", {exact: true}).selectOption("2031");
  await calendar.getByLabel("Month", {exact: true}).selectOption("7");
  // Days are announced in full, so match the date rather than the digits.
  await calendar.getByRole("button", {name: /27 August 2031/}).click();
  await expect(calendar).toHaveCount(0);

  await page.getByRole("button", {name: "Create session"}).click();
  await expect(page.getByText("Session created.")).toBeVisible();
  await page.getByRole("button", {name: "Close"}).click();

  const row = page.getByRole("button", {name: /Edit session: 27 August 2031/});
  await expect(row).toBeVisible();
  await row.click();
  await page.getByRole("button", {name: "Delete session"}).click();
  await page.getByRole("button", {name: "Confirm delete"}).click();
  await expect(row).toHaveCount(0);
});
