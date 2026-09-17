import {expect, type Page, test} from "@playwright/test";

import {replaySession} from "./helpers/session";

const phone = {width: 390, height: 844};

replaySession("admin");

function pane(page: Page, name: string) {
  return page.getByRole("region", {name});
}

function entries(page: Page) {
  return page.locator("[data-kind]");
}

async function rowKinds(page: Page) {
  return entries(page).evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-kind") ?? ""),
  );
}

async function rowSummaries(scope: Page | ReturnType<typeof pane>) {
  const texts = await scope.locator("[data-kind]").allInnerTexts();
  return texts.map((text) => text.replace(/\s+/g, " ").trim());
}

test("the control panel shows today, upcoming and history at once", async ({page}) => {
  await page.goto("/en/admin/overview");

  await expect(page.getByRole("heading", {level: 1, name: "Control panel"})).toBeAttached();
  await expect(pane(page, "Today")).toBeVisible();
  await expect(pane(page, "Upcoming")).toBeVisible();
  await expect(pane(page, "History")).toBeVisible();

  const kinds = await rowKinds(page);
  expect(kinds.length).toBeGreaterThan(0);
  expect(kinds.includes("change")).toBe(false);

  const log = pane(page, "History").getByRole("link", {name: /\d+ log/i});
  test.skip((await log.count()) === 0, "needs audit-log rows in history");
  await log.click();
  await expect(page).toHaveURL(/kind=change/);
  await expect(pane(page, "History").getByRole("link", {name: /\d+ log/i})).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(new Set(await rowKinds(page))).toEqual(new Set(["change"]));
});

test("/admin lands on the control panel", async ({page}) => {
  await page.goto("/de/admin");

  await expect(page).toHaveURL(/\/de\/admin\/overview$/);
  await expect(
    page.getByRole("heading", {level: 1, name: "Kontrollzentrum"}),
  ).toBeAttached();
  await expect(pane(page, "Heute")).toBeVisible();
  await expect(pane(page, "Bevorstehend")).toBeVisible();
  await expect(pane(page, "Verlauf")).toBeVisible();
});

test("paging through history moves only that pane", async ({page}) => {
  await page.goto("/en/admin/overview?kind=change");

  const history = pane(page, "History");
  const firstPage = await rowSummaries(history);
  expect(firstPage.length).toBeGreaterThan(1);

  const next = history.getByRole("link", {name: "Next"});
  test.skip((await next.count()) === 0, "needs more than one page of history");

  await next.click();
  await expect(page).toHaveURL(/hp=2/);
  await expect(history.getByText(/^Page 2 of \d+$/)).toBeVisible();
  expect(await rowSummaries(history)).not.toEqual(firstPage);
});

test("search narrows every pane and can be cleared", async ({page}) => {
  await page.goto("/en/admin/overview");

  await page.getByLabel("Search").fill("zzz-no-such-person");
  await page.getByRole("button", {name: "Show"}).click();
  await expect(page.getByText("No activity matches this search.")).toHaveCount(3);

  await page.getByRole("link", {name: "Clear"}).click();
  await expect(entries(page).first()).toBeVisible();
});

test("removing a waiting-list contact asks before it destroys the request", async ({
  page,
}) => {
  await page.goto("/en/admin/overview?kind=waitlist");

  const remove = page.getByRole("button", {name: "Remove", exact: true}).first();
  await remove.click();

  const keep = page.getByRole("button", {name: "Keep on the list"}).first();
  await expect(keep).toBeVisible();
  await expect(page.getByRole("button", {name: "Remove contact"}).first()).toBeVisible();
  await keep.click();
  await expect(page.getByRole("button", {name: "Remove", exact: true}).first()).toBeVisible();
});

test("the control panel fits a phone in every locale without scrolling the page", async ({
  page,
}) => {
  await page.setViewportSize(phone);

  for (const locale of ["fr", "de", "en"] as const) {
    await page.goto(`/${locale}/admin/overview`);
    await expect(entries(page).first()).toBeVisible();

    const overflow = await page.evaluate(() => ({
      x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    }));
    expect(overflow.x, `horizontal overflow in ${locale}`).toBeLessThanOrEqual(0);
    expect(overflow.y, `page scroll in ${locale}`).toBeLessThanOrEqual(1);
  }
});

test("the desktop board fills the viewport without scrolling the page", async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await page.goto("/en/admin/overview");

  await expect(pane(page, "Today")).toBeVisible();
  await expect(pane(page, "Upcoming")).toBeVisible();
  await expect(pane(page, "History")).toBeVisible();

  const box = await page.evaluate(() => {
    const today = document.querySelector('[aria-label="Today"]');
    const history = document.querySelector('[aria-label="History"]');
    if (!today || !history) {
      return null;
    }
    const left = today.getBoundingClientRect();
    const right = history.getBoundingClientRect();
    return {
      sameRow: Math.abs(left.top - right.top) < 2,
      pageScroll: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    };
  });

  expect(box).not.toBeNull();
  expect(box?.sameRow).toBe(true);
  expect(box?.pageScroll).toBeLessThanOrEqual(1);
});
