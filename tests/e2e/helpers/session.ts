import {existsSync} from "node:fs";
import path from "node:path";

import {test, type Browser, type Page} from "@playwright/test";

export type SessionRole = "admin" | "therapist";

/**
 * Accounts the suite signs in with, read from `.env.local` by the Playwright
 * config. Point them at whatever the environment seeded.
 */
export const credentials: Record<SessionRole, {email: string; password: string}> = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? "qa.admin@example.test",
    password: process.env.E2E_ADMIN_PASSWORD ?? "qa-password-12",
  },
  therapist: {
    email: process.env.E2E_ROOM_EMAIL ?? "qa.therapist@example.test",
    password: process.env.E2E_ROOM_PASSWORD ?? "qa-password-12",
  },
};

export function sessionFile(role: SessionRole): string {
  return path.join("playwright", ".auth", `${role}.json`);
}

export async function signInAs(page: Page, role: SessionRole) {
  // Land on a cheap page: the session is what matters, not what renders next.
  const landing = "/en/account";
  const {email, password} = credentials[role];

  await page.goto(`/en/sign-in?next=${encodeURIComponent(landing)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", {exact: true}).fill(password);
  await page.getByRole("button", {name: /sign in/i}).click();
  // Match on the path alone: the destination also appears in the sign-in query.
  await page.waitForURL((url) => url.pathname === landing);
}

/**
 * Sign-in is rate limited per account *and* per address (five attempts a
 * quarter hour), so a run reuses a stored session whenever it still works and
 * only authenticates when it does not.
 */
export async function ensureSession(browser: Browser, page: Page, role: SessionRole) {
  const file = sessionFile(role);
  if (existsSync(file) && (await sessionStillWorks(browser, file))) {
    return;
  }

  await signInAs(page, role);
  await page.context().storageState({path: file});
}

/** Replays a stored session for every test in a spec. Call at the top level. */
export function replaySession(role: SessionRole) {
  test.use({storageState: sessionFile(role)});
}

async function sessionStillWorks(browser: Browser, file: string): Promise<boolean> {
  const context = await browser.newContext({storageState: file});
  try {
    const page = await context.newPage();
    const response = await page.goto("/en/account");
    // A signed-out visitor is sent to sign-in instead.
    return new URL(page.url()).pathname === "/en/account" && response?.ok() === true;
  } catch {
    return false;
  } finally {
    await context.close();
  }
}
