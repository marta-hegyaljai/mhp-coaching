import {expect, type Page, test} from "@playwright/test";

import {replaySession} from "./helpers/session";

const phone = {width: 390, height: 844};

replaySession("admin");

function channel(page: Page, name: RegExp) {
  return page.getByRole("navigation", {name: "Channels"}).getByRole("link", {name});
}

async function column(page: Page, index: number) {
  const cells = await page
    .getByRole("table")
    .getByRole("row")
    .locator(`td:nth-child(${index})`)
    .allInnerTexts();
  // Cells wrap, so compare on normalized text rather than the rendered lines.
  return cells.map((text) => text.replace(/\s+/g, " ").trim());
}

test("the control panel gathers every channel behind one timeline", async ({page}) => {
  await page.goto("/en/admin/overview?when=history");

  await expect(page.getByRole("heading", {level: 1, name: "Control panel"})).toBeVisible();
  for (const name of [
    /^All/,
    /^Registrations/,
    /^Reservations/,
    /^Advice calls/,
    /^Messages/,
    /^Waiting list/,
    /^Changes/,
  ]) {
    await expect(channel(page, name)).toBeVisible();
  }

  // Picking a channel narrows the list and keeps the window.
  await channel(page, /^Waiting list/).click();
  await expect(page).toHaveURL(/when=history/);
  await expect(page).toHaveURL(/kind=waitlist/);
  await expect(channel(page, /^Waiting list/)).toHaveAttribute("aria-current", "page");

  const kinds = await column(page, 2);
  expect(kinds.length).toBeGreaterThan(0);
  // The chip is uppercased in CSS, so compare on the word alone.
  expect(new Set(kinds.map((text) => text.toLowerCase()))).toEqual(
    new Set(["waiting list"]),
  );
});

test("/admin lands on the control panel", async ({page}) => {
  await page.goto("/de/admin");

  await expect(page).toHaveURL(/\/de\/admin\/overview$/);
  await expect(
    page.getByRole("heading", {level: 1, name: "Kontrollzentrum"}),
  ).toBeVisible();
});

test("paging through history moves the window on by one full page", async ({page}) => {
  await page.goto("/en/admin/overview?when=history");

  const firstPage = await column(page, 4);
  expect(firstPage.length).toBeGreaterThan(1);

  const next = page.getByRole("link", {name: "Next"});
  test.skip((await next.count()) === 0, "needs more than one page of history");

  await expect(page.getByText(/^1–\d+ of \d+ entries$/)).toBeVisible();
  await next.click();
  await expect(page).toHaveURL(/page=2/);

  // The range picks up exactly where the first page stopped.
  await expect(
    page.getByText(new RegExp(`^${firstPage.length + 1}–\\d+ of \\d+ entries$`)),
  ).toBeVisible();
  expect(await column(page, 4)).not.toEqual(firstPage);
});

test("search narrows the timeline and can be cleared", async ({page}) => {
  await page.goto("/en/admin/overview?when=history");

  await page.getByLabel("Search").fill("zzz-no-such-person");
  await page.getByRole("button", {name: "Show"}).click();
  await expect(page.getByText("No activity matches this search.")).toBeVisible();

  await page.getByRole("link", {name: "Clear"}).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("removing a waiting-list contact asks before it destroys the request", async ({
  page,
}) => {
  await page.goto("/en/admin/overview?when=history&kind=waitlist");

  const remove = page.getByRole("button", {name: "Remove", exact: true}).first();
  await remove.click();

  // Nothing is deleted on the first click; the safe way out stays available.
  const keep = page.getByRole("button", {name: "Keep on the list"}).first();
  await expect(keep).toBeVisible();
  await expect(page.getByRole("button", {name: "Remove contact"}).first()).toBeVisible();
  await keep.click();
  await expect(page.getByRole("button", {name: "Remove", exact: true}).first()).toBeVisible();
});

test("the control panel fits a phone in every locale", async ({page}) => {
  await page.setViewportSize(phone);

  for (const locale of ["fr", "de", "en"]) {
    await page.goto(`/${locale}/admin/overview?when=history`);
    // Below lg the timeline becomes cards; the wide table stays out of reach.
    await expect(page.getByRole("table")).toBeHidden();
    await expect(page.getByRole("listitem").first()).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow in ${locale}`).toBeLessThanOrEqual(0);
  }
});
