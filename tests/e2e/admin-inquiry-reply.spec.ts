import {expect, test} from "@playwright/test";

import {replaySession} from "./helpers/session";

replaySession("admin");

const replyBody =
  "The March dates are confirmed and the training is ASCA-recognised.";

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

test("an admin can email a reply to a written course question", async ({page}) => {
  await page.goto("/en/admin/calls?tab=messages");

  await page.getByRole("link", {name: /Paul Question/}).click();
  await expect(page.getByRole("heading", {level: 1, name: "Paul Question"})).toBeVisible();
  await expect(page.getByRole("heading", {name: "Reply by email"})).toBeVisible();

  await page.getByLabel("Your reply").fill(replyBody);
  await page.getByRole("button", {name: "Send email"}).click();

  await expect(page.getByRole("status")).toContainText("The reply has been sent.");
  await expect(page.getByText(replyBody).first()).toBeVisible();
  await expect(page.getByText("Replied").first()).toBeVisible();

  const mail = await latestMailpitMessage(
    "paul.question@example.test",
    "Notre réponse — Praticien·ne en Hypnose OMNI®",
  );
  expect(mail.Text).toContain(replyBody);
  expect(mail.HTML).toContain("role=\"presentation\"");
  expect(mail.HTML).toContain("#c8aa6a");
});

test("the reply form stays localized in French and German", async ({page}) => {
  await page.goto("/en/admin/calls?tab=messages");
  await page.getByRole("link", {name: /Sara Contact/}).click();
  await expect(page.getByRole("heading", {name: "Reply by email"})).toBeVisible();

  await page.goto(page.url().replace("/en/", "/fr/"));
  await expect(page.getByRole("heading", {name: "Répondre par e-mail"})).toBeVisible();
  await expect(page.getByLabel("Votre réponse")).toBeVisible();
  await expect(page.getByRole("button", {name: "Envoyer l’e-mail"})).toBeVisible();

  await page.goto(page.url().replace("/fr/", "/de/"));
  await expect(page.getByRole("heading", {name: "Per E-Mail antworten"})).toBeVisible();
  await expect(page.getByLabel("Ihre Antwort")).toBeVisible();
  await expect(page.getByRole("button", {name: "E-Mail senden"})).toBeVisible();
});
