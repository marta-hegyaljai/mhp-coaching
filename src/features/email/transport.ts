import nodemailer from "nodemailer";
import type {Transporter} from "nodemailer";

import {organization} from "@/features/organization/info";

type MailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === "true",
  });

  return transporter;
}

export async function sendMail(input: MailInput): Promise<void> {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM ?? `${organization.brandName} <no-reply@mhp.local>`,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
