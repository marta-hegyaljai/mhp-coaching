import {composeTransactionalEmail} from "@/features/email/layout";
import {emailTranslator} from "@/features/email/catalog";
import {sendMail} from "@/features/email/transport";
import {organization} from "@/features/organization/info";

function opsAlertEmail(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): string | undefined {
  const value = environment.OPS_ALERT_EMAIL?.trim();
  return value || undefined;
}

export async function sendOpsAlert(input: {
  job: string;
  ranAt: string;
  error: string;
}): Promise<void> {
  const to = opsAlertEmail();
  if (!to) {
    return;
  }
  const t = emailTranslator("en", "Email.opsAlert");
  const fields = emailTranslator("en", "Email.fields");
  const html = composeTransactionalEmail({
    locale: "en",
    preheader: t("intro"),
    eyebrow: t("eyebrow"),
    title: t("title"),
    intro: t("intro"),
    details: [
      {label: fields("status"), value: input.job},
      {label: fields("time"), value: input.ranAt},
      {label: fields("reference"), value: input.error},
    ],
    closing: t("closing"),
  });
  const text = [t("intro"), "", `${input.job} @ ${input.ranAt}`, input.error, "", t("closing")].join(
    "\n",
  );
  await sendMail({
    to,
    subject: t("subject", {job: input.job}),
    text,
    html,
    replyTo: organization.email,
  });
}
