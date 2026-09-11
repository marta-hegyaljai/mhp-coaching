import {expect, type Page, test} from "@playwright/test";

const therapistEmail = process.env.E2E_ROOM_EMAIL ?? "qa.therapist@example.test";
const therapistPassword = process.env.E2E_ROOM_PASSWORD ?? "qa-password-12";
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "qa.admin@example.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "qa-password-12";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/en/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", {exact: true}).fill(password);
  await page.getByRole("button", {name: /sign in/i}).click();
  await page.waitForURL(/\/en\/(account|rooms|admin)/);
}

test.describe("current-month usage and discounts", () => {
  test.describe.configure({mode: "serial"});

  test("therapist sees an open, not-finalized usage page in EN and FR", async ({page}) => {
    await signIn(page, therapistEmail, therapistPassword);
    await page.goto("/en/billing");
    await expect(page.getByRole("heading", {name: "Current month"})).toBeVisible();
    await expect(page.getByText("Open — not finalized")).toBeVisible();
    await expect(page.getByRole("link", {name: "Usage"})).toHaveAttribute("aria-current", "page");
    await expect(page.locator("main")).not.toContainText("MISSING_MESSAGE");

    await page.setViewportSize({width: 390, height: 844});
    await page.goto("/fr/facturation");
    await expect(page.getByRole("heading", {name: "Mois en cours"})).toBeVisible();
    await expect(page.getByText("Ouvert — non finalisé")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("admin can set a discount and open current-month billing", async ({page}) => {
    await signIn(page, adminEmail, adminPassword);
    await page.goto("/en/admin/users");
    await page.getByLabel("Search").fill("qa.therapist@example.test");
    await page.getByRole("button", {name: "Show"}).click();
    await expect(page.getByText("qa.therapist@example.test")).toBeVisible();
    await page.getByRole("link", {name: "Manage"}).first().click();
    await expect(page.getByRole("heading", {name: "Room discount"})).toBeVisible();
    await page.getByLabel("Discount (%)").fill("10");
    await page.getByRole("button", {name: "Save discount"}).click();
    await expect(page.getByText("Discount updated. Existing bookings are unchanged.")).toBeVisible();

    await page.goto("/en/admin/billing");
    await expect(page.getByRole("heading", {name: "Current month usage"})).toBeVisible();
    await expect(page.getByText("Open — not finalized")).toBeVisible();
    await expect(page.getByRole("link", {name: "Download current totals CSV"})).toBeVisible();
  });
});
