import {expect, test} from "@playwright/test";

const password = "Walkthrough-12x";
const nextPassword = "Walkthrough-13x";
const resetPassword = "Walkthrough-14x";

async function latestMailpitMessage(to: string, subject: string) {
  const list = await fetch("http://127.0.0.1:8025/api/v1/messages");
  if (!list.ok) {
    throw new Error(`Mailpit list failed: ${list.status}`);
  }
  const data = (await list.json()) as {
    messages: Array<{ID: string; Subject: string; To: Array<{Address: string}>}>;
  };
  const match = data.messages.find(
    (message) =>
      message.Subject === subject &&
      message.To.some((recipient) => recipient.Address === to),
  );
  if (!match) {
    throw new Error(`No Mailpit message for ${to} with subject ${subject}`);
  }
  const detail = await fetch(`http://127.0.0.1:8025/api/v1/message/${match.ID}`);
  if (!detail.ok) {
    throw new Error(`Mailpit message failed: ${detail.status}`);
  }
  return detail.json() as Promise<{Text: string; HTML: string}>;
}

function firstHttpUrl(text: string): string {
  const match = text.match(/https?:\/\/[^\s"<]+/);
  if (!match) {
    throw new Error("No URL in mail");
  }
  return match[0];
}

test("sign-up keeps submitted names when a short password is rejected", async ({page}) => {
  await page.goto("/en/sign-up");
  await page.getByLabel("First name").fill("Walk");
  await page.getByLabel("Last name").fill("Through");
  await page.getByLabel("Email").fill("short-password@example.test");
  await page.getByLabel("Password", {exact: true}).fill("short");
  await page.getByLabel("Confirm password").fill("short");
  await page.getByRole("button", {name: "Create account"}).click();

  await expect(page.getByRole("alert").filter({hasText: "Use at least 12 characters."})).toBeVisible();
  await expect(page.getByLabel("First name")).toHaveValue("Walk");
  await expect(page.getByLabel("Last name")).toHaveValue("Through");
  await expect(page.getByLabel("Email")).toHaveValue("short-password@example.test");
  await expect(page.getByLabel("Password", {exact: true})).toHaveValue("");
});

test("a new user can verify, change password and reset access", async ({page}) => {
  const email = `cp01-${Date.now()}@example.test`;

  await page.goto("/en/sign-up");
  await expect(page.getByRole("heading", {name: "Create an account"})).toBeVisible();
  await page.getByLabel("First name").fill("Walk");
  await page.getByLabel("Last name").fill("Through");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", {exact: true}).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", {name: "Create account"}).click();
  await expect(page.getByRole("status")).toContainText(
    `We have sent a confirmation email to ${email}`,
  );
  await expect(page.getByText("Open that message and follow the link")).toBeVisible();

  const verification = await latestMailpitMessage(email, "Confirm your MHP account");
  expect(verification.HTML).toContain("#c8aa6a");
  expect(verification.HTML).toContain('href="http://localhost:3000/en/verify-email/');
  await page.goto(firstHttpUrl(verification.Text).replace("http://localhost:3000", ""));
  await expect(page).toHaveURL(/\/en\/account\?verified=1/);
  await expect(page.getByRole("status")).toContainText("Your email is confirmed. You are signed in.");
  await expect(page.getByRole("button", {name: "Account menu"})).toContainText("Walk Through");
  await page.getByRole("navigation", {name: "Profile"}).getByRole("link", {name: "My courses"}).click();
  await expect(page).toHaveURL(/\/en\/account\/courses/);
  await expect(page.getByRole("heading", {name: "My courses"})).toBeVisible();
  await expect(page.getByText("No course registrations are linked")).toBeVisible();
  await expect(page.getByRole("heading", {name: "Certificates"})).toBeVisible();

  await page.getByRole("navigation", {name: "Profile"}).getByRole("link", {name: "Profile"}).click();
  await expect(page.getByRole("heading", {name: "Profile"})).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue(email);
  await expect(page.getByLabel("Email")).toHaveAttribute("readonly");
  await expect(page.locator("#account-email-locked")).toHaveText(
    "The account email cannot be changed.",
  );
  await page.getByLabel("Current password").fill(password);
  await page.getByLabel("New password").fill(nextPassword);
  await page.getByLabel("Confirm password").fill(nextPassword);
  await page.getByRole("button", {name: "Change password"}).click();
  await expect(page.getByRole("status")).toContainText("Password updated");

  await page.getByRole("navigation", {name: "Profile"}).getByRole("button", {name: "Sign out"}).click();
  await expect(page).toHaveURL(/\/en\/sign-in/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(nextPassword);
  await page.getByRole("button", {name: "Sign in"}).click();
  await expect(page).toHaveURL(/\/en\/account/);
  await expect(page.getByRole("button", {name: "Account menu"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Account menu"})).toContainText("Walk Through");

  await page.getByRole("navigation", {name: "Profile"}).getByRole("button", {name: "Sign out"}).click();
  await expect(page).toHaveURL(/\/en\/sign-in/);

  await page.goto("/en/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", {name: "Send reset link"}).click();
  await expect(page.getByRole("status")).toContainText("we have sent a reset link");

  const recovery = await latestMailpitMessage(email, "Reset your MHP password");
  expect(recovery.HTML).toContain('href="http://localhost:3000/en/reset-password/');
  await page.goto(firstHttpUrl(recovery.Text).replace("http://localhost:3000", ""));
  await page.getByLabel("Password", {exact: true}).fill(resetPassword);
  await page.getByLabel("Confirm password").fill(resetPassword);
  await page.getByRole("button", {name: "Save password and sign in"}).click();
  await expect(page).toHaveURL(/\/en\/account/);
});
