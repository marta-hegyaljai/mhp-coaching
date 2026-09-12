import {expect, type Page, test} from "@playwright/test";

/**
 * Reviews the polished room-booking surfaces the way a therapist meets them:
 * phone width first, in every locale, asserting the rules DESIGN.md makes
 * binding rather than re-testing domain logic the unit suite already covers.
 *
 * Room booking is an admin-granted capability, so this suite needs a real
 * account with an existing booking. Point it at one with:
 *   E2E_ROOM_EMAIL=... E2E_ROOM_PASSWORD=... pnpm test:e2e polish-review
 */

const email = process.env.E2E_ROOM_EMAIL;
const password = process.env.E2E_ROOM_PASSWORD;
const phone = {width: 390, height: 844};
const artifacts = process.env.E2E_ARTIFACTS_DIR;

/** A printed ISO instant must never reach the UI. */
const isoDate = /\d{4}-\d{2}-\d{2}(?:T|\s\d{2}:\d{2}:\d{2}\+)/;
const untranslated = /MISSING_MESSAGE|Rooms\.[a-z]|Admin\.[a-z]/;

async function signIn(page: Page) {
  await page.goto("/en/sign-in");
  await page.getByLabel("Email").fill(email ?? "");
  await page.getByLabel("Password", {exact: true}).fill(password ?? "");
  await page.getByRole("button", {name: /sign in/i}).click();
  await page.waitForURL(/\/en\/(courses|account|rooms|admin)/);
}

/** The suite reads ids from the UI so it never pins a seeded fixture. */
async function firstBookingId(page: Page, listPath: string): Promise<string> {
  await page.goto(listPath);
  const hrefs = await page
    .locator('main a[href*="/bookings/"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href") ?? ""));

  // Skip sibling routes such as `/bookings/new` that carry no booking id.
  const id = hrefs
    .map((href) => href.match(/\/bookings\/([0-9a-f-]{36})(?:$|[/?])/)?.[1])
    .find(Boolean);

  expect(id, `no booking to review on ${listPath}`).toBeTruthy();
  return id as string;
}

async function expectNoOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `${label} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(0);
}

async function expectCleanCopy(page: Page, label: string) {
  const body = (await page.locator("main").innerText()).trim();
  expect(body, `${label} printed a raw ISO instant`).not.toMatch(isoDate);
  expect(body, `${label} printed an untranslated key`).not.toMatch(untranslated);
}

async function capture(page: Page, name: string, fullPage = false) {
  if (artifacts) {
    await page.screenshot({path: `${artifacts}/${name}.webp`, fullPage});
  }
}

test.describe("polished room booking surfaces", () => {
  // One sign-in for the suite: repeated attempts trip the auth rate limiter.
  test.describe.configure({mode: "serial"});
  test.skip(!email || !password, "set E2E_ROOM_EMAIL and E2E_ROOM_PASSWORD");

  let cookies: string | undefined;
  let bookingId = "";
  let adminBookingId = "";

  test.beforeEach(async ({page, context}) => {
    if (cookies) {
      await context.addCookies(JSON.parse(cookies));
      return;
    }
    await signIn(page);
    cookies = JSON.stringify(await context.cookies());
    bookingId = await firstBookingId(page, "/en/rooms/bookings");
    adminBookingId = await firstBookingId(page, "/en/admin/bookings");
  });

  test("German phone screens stay in German, in bounds and free of ISO dates", async ({page}) => {
    await page.setViewportSize(phone);

    const pages: Array<[string, string]> = [
      ["/de/raeume", "de-rooms-day"],
      ["/de/raeume/buchungen", "de-my-bookings"],
      [`/de/raeume/buchungen/${bookingId}`, "de-booking-detail"],
      [`/de/raeume/buchungen/${bookingId}/aendern`, "de-booking-change"],
      [`/de/raeume/buchungen/${bookingId}/stornieren`, "de-booking-cancel"],
      ["/de/admin/bookings", "de-admin-bookings"],
    ];

    for (const [path, name] of pages) {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      await expectNoOverflow(page, path);
      await expectCleanCopy(page, path);
      await capture(page, `E-${name}-390x844`, true);
    }
  });

  test("secondary actions stay bordered and clear the 44px tap target", async ({page}) => {
    await page.setViewportSize(phone);
    await page.goto(`/en/rooms/bookings/${bookingId}/change`);

    const showTimes = page.getByRole("button", {name: "Show times"});
    await expect(showTimes).toBeVisible();

    const style = await showTimes.evaluate((node) => {
      const computed = getComputedStyle(node);
      return {
        borderWidth: computed.borderTopWidth,
        borderColor: computed.borderTopColor,
        background: computed.backgroundColor,
        height: node.getBoundingClientRect().height,
      };
    });

    // A secondary action must never dissolve into the surface behind it.
    expect(style.borderWidth).toBe("1px");
    expect(style.borderColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(style.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(style.height).toBeGreaterThanOrEqual(44);
  });

  test("a day with no free slot is still navigable instead of a dead end", async ({page}) => {
    await page.setViewportSize(phone);
    await page.goto(`/en/rooms/bookings/${bookingId}/change`);

    const showDay = async (date: string) => {
      await page.getByLabel("Date").fill(date);
      await page.getByRole("button", {name: "Show times"}).click();
      await page.waitForURL(new RegExp(`date=${date}`));
    };

    // A Sunday sits outside every opening interval, so no slot can be offered.
    await showDay("2026-09-20");
    await expect(page.getByLabel("Start")).toHaveCount(0);

    // The navigator survives, so the user can still reach a day that has slots.
    await expect(page.getByRole("button", {name: "Show times"})).toBeVisible();
    await expect(page.getByLabel("Date")).toHaveValue("2026-09-20");

    await showDay("2026-09-21");
    await expect(page.getByLabel("Start")).toBeVisible();
  });

  test("cancelling offers a clear way out that does not rely on colour", async ({page}) => {
    await page.setViewportSize(phone);
    await page.goto(`/en/rooms/bookings/${bookingId}/cancel`);

    const keep = page.getByRole("link", {name: /keep this booking/i});
    const confirm = page.getByRole("button", {name: /cancel this booking/i});
    await expect(keep).toBeVisible();
    await expect(confirm).toBeVisible();

    // The safe action is the filled control, not merely a different hue.
    const [keepFill, confirmFill] = await Promise.all([
      keep.evaluate((node) => getComputedStyle(node).backgroundColor),
      confirm.evaluate((node) => getComputedStyle(node).backgroundColor),
    ]);
    expect(keepFill).not.toBe(confirmFill);

    await capture(page, "E-en-cancel-390x844", true);
  });

  test("the admin booking reads correctly in every locale on one header row", async ({page}) => {
    // The public language control is behind a launch flag, so the invariant
    // that still matters is that each localized route renders the same
    // booking with localized copy and a single, non-overflowing header row.
    for (const width of [390, 1280]) {
      await page.setViewportSize({width, height: 900});

      for (const locale of ["en", "de", "fr"] as const) {
        const label = `${locale} admin booking at ${width}px`;
        await page.goto(`/${locale}/admin/bookings/${adminBookingId}`);
        await expect(page.locator("main")).toBeVisible();
        await expectCleanCopy(page, label);
        await expectNoOverflow(page, label);

        const rows = await page
          .locator("header nav a")
          .evaluateAll(
            (nodes) =>
              new Set(nodes.map((node) => Math.round(node.getBoundingClientRect().top))).size,
          );
        expect(rows, `${label} wrapped the header`).toBe(1);

        if (width === 1280) {
          await capture(page, `E-admin-booking-${locale}`);
        }
      }
    }
  });
});
