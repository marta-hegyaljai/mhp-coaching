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
  await expect(log).toBeVisible();
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
  await page.setViewportSize({width: 1440, height: 900});
  await page.goto("/en/admin/overview?kind=change");

  const history = pane(page, "History");
  const firstPage = await rowSummaries(history);
  expect(firstPage.length).toBeGreaterThan(1);

  const next = history.getByRole("link", {name: "Next"});
  await expect(next).toBeVisible();

  await next.click();
  await expect(page).toHaveURL(/hp=2/);
  await expect(history.getByText(/^Page 2 of \d+$/)).toBeVisible();
  expect(await rowSummaries(history)).not.toEqual(firstPage);
});

test("search narrows every pane and can be cleared", async ({page}) => {
  await page.goto("/en/admin/overview");

  await page.getByLabel("Search").fill("zzz-no-such-person");
  await page.getByRole("button", {name: "Show", exact: true}).click();
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

  const historyLabel = {fr: "Historique", de: "Verlauf", en: "History"} as const;

  for (const locale of ["fr", "de", "en"] as const) {
    await page.goto(`/${locale}/admin/overview`);
    await expect(entries(page).first()).toBeVisible();

    const overflow = await page.evaluate((label) => {
      const board = document.querySelector(`[aria-label="${label}"]`);
      const bottom = board?.getBoundingClientRect().bottom ?? Infinity;
      return {
        x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        boardBottom: bottom,
        viewport: window.innerHeight,
      };
    }, historyLabel[locale]);
    expect(overflow.x, `horizontal overflow in ${locale}`).toBeLessThanOrEqual(0);
    expect(overflow.y, `page scroll in ${locale}`).toBeLessThanOrEqual(1);
    expect(overflow.boardBottom, `board clipped to viewport in ${locale}`).toBeLessThanOrEqual(
      overflow.viewport + 1,
    );
  }
});

test("the Today pane can move to another Zurich day and back", async ({page}) => {
  await page.goto("/en/admin/overview");

  const today = pane(page, "Today");
  await today.getByRole("link", {name: "Previous day"}).click();
  await expect(page).toHaveURL(/[?&]day=\d{4}-\d{2}-\d{2}/);
  await expect(today.getByRole("link", {name: "Today", exact: true})).toBeVisible();

  await today.getByRole("link", {name: "Today", exact: true}).click();
  await expect(page).not.toHaveURL(/[?&]day=/);
  await expect(today.getByRole("link", {name: "Today", exact: true})).toHaveCount(0);
});

test("Upcoming and History hide cancelled rows until asked", async ({page}) => {
  await page.goto("/en/admin/overview");

  const upcoming = pane(page, "Upcoming");
  const history = pane(page, "History");
  await expect(upcoming.getByRole("checkbox", {name: "Show cancelled"})).not.toBeChecked();
  await expect(history.getByRole("checkbox", {name: "Show cancelled"})).not.toBeChecked();
  await expect(upcoming.getByText("Nina Abgesagt")).toHaveCount(0);

  await upcoming.getByRole("checkbox", {name: "Show cancelled"}).check();
  await expect(page).toHaveURL(/uc=1/);
  await expect(upcoming.getByText("Nina Abgesagt")).toBeVisible();
  await expect(history.getByRole("checkbox", {name: "Show cancelled"})).not.toBeChecked();
});

test("the admin rail stays beside the board and the booking action stays in the header", async ({
  page,
}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await page.goto("/en/admin/overview");

  const sections = page.getByRole("navigation", {name: "Admin sections"});
  await expect(sections.getByRole("link", {name: "Overview"})).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("link", {name: "Dates and registration"})).toBeVisible();

  await sections.getByRole("link", {name: "Users"}).click();
  await expect(page).toHaveURL(/\/en\/admin\/users/);
  await expect(page.getByRole("heading", {name: "Users", exact: true})).toBeVisible();
  await expect(page.getByRole("link", {name: "Dates and registration"})).toBeVisible();
});

test("the phone section sheet switches destinations without hiding the booking action", async ({
  page,
}) => {
  await page.setViewportSize(phone);
  await page.goto("/en/admin/overview");

  await expect(page.getByRole("link", {name: "Dates", exact: true})).toBeVisible();
  await page.getByRole("button", {name: "Administration: Overview"}).click();
  const sections = page.getByRole("navigation", {name: "Admin sections"});
  await expect(sections).toBeVisible();
  await sections.getByRole("link", {name: "Users"}).click();
  await expect(page).toHaveURL(/\/en\/admin\/users/);
  await expect(page.getByRole("heading", {name: "Users", exact: true})).toBeVisible();
  await expect(page.getByRole("link", {name: "Dates", exact: true})).toBeVisible();
});

test("the desktop board fills the viewport without scrolling the page", async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await page.goto("/en/admin/overview");

  await expect(pane(page, "Today")).toBeVisible();
  await expect(pane(page, "Upcoming")).toBeVisible();
  await expect(pane(page, "History")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const today = document.querySelector('[aria-label="Today"]');
    const history = document.querySelector('[aria-label="History"]');
    if (!today || !history) {
      return null;
    }
    const left = today.getBoundingClientRect();
    const right = history.getBoundingClientRect();
    return {
      sameRow: Math.abs(left.top - right.top) < 2,
      boardBottom: Math.max(left.bottom, right.bottom),
      viewport: window.innerHeight,
      pageScroll: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics?.sameRow).toBe(true);
  expect(metrics!.boardBottom).toBeLessThanOrEqual(metrics!.viewport + 1);
  expect(metrics?.pageScroll).toBeLessThanOrEqual(1);
});
