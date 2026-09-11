import nodemailer from "nodemailer";
import type {Transporter} from "nodemailer";

import {getResendApiKey, getResendFromAddress} from "@/features/email/credentials";

type MailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
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

async function sendViaResend(input: MailInput): Promise<void> {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    throw new Error("Resend API key is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getResendFromAddress(),
      to: [input.to],
      reply_to: input.replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend rejected the message (${response.status}): ${detail}`);
  }
}

export async function sendMail(input: MailInput): Promise<void> {
  if (getResendApiKey()) {
    await sendViaResend(input);
    return;
  }

  await getTransporter().sendMail({
    from: getResendFromAddress(),
    to: input.to,
    replyTo: input.replyTo,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
