import {test as setup} from "@playwright/test";

import {ensureSession} from "./helpers/session";

setup("authenticate as admin", async ({browser, page}) => {
  await ensureSession(browser, page, "admin");
});

setup("authenticate as therapist", async ({browser, page}) => {
  setup.skip(!process.env.E2E_ROOM_EMAIL, "set E2E_ROOM_EMAIL and E2E_ROOM_PASSWORD");
  await ensureSession(browser, page, "therapist");
});
