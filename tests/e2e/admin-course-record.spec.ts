import {expect, type Page, test} from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "qa.admin@example.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "qa-password-12";
const phone = {width: 390, height: 844};

async function signIn(page: Page) {
  await page.goto("/en/sign-in");
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password", {exact: true}).fill(adminPassword);
  await page.getByRole("button", {name: /sign in/i}).click();
  await page.waitForURL(/\/en\/(courses|account|rooms|admin)/);
}

test("the course record has a visible way back to the catalogue list", async ({
  page,
}) => {
  await signIn(page);

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

test("session dates open the product calendar, not the native picker", async ({page}) => {
  await signIn(page);
  await page.goto("/de/admin/courses/advanced-techniques");
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
