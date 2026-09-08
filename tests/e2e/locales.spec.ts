import {expect, test} from "@playwright/test";

const locales = [
  {locale: "fr", text: "Le site de formation multilingue est en préparation."},
  {locale: "de", text: "Die mehrsprachige Ausbildungswebsite wird vorbereitet."},
  {locale: "en", text: "The multilingual training website is being prepared."},
] as const;

for (const {locale, text} of locales) {
  test(`${locale} homepage renders its translation`, async ({page}) => {
    await page.goto(`/${locale}`);

    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", {name: "MHP Hypnose"})).toBeVisible();
    await expect(page.getByText(text)).toBeVisible();
  });
}

test("root redirects to French and the language switcher preserves the page", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/fr$/);

  await page.getByRole("combobox").selectOption("de");
  await expect(page).toHaveURL(/\/de$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
});
