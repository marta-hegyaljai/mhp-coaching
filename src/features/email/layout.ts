import {organization} from "@/features/organization/info";

import {escapeHtml} from "./html";

// Binding visual rules: docs/EMAIL.md. Always compose mail through this module.

const INK = "#090909";
const PAPER = "#ffffff";
const SHELL = "#f3f3f1";
const MUTED = "#383838";
const SUBTLE = "#5c5c5c";
const GOLD = "#c8aa6a";
const LINE = "#d5d5d1";
const SANS = "Arial, Helvetica, sans-serif";
const SERIF = "Georgia, 'Times New Roman', Times, serif";

export type EmailDetail = {
  label: string;
  value: string;
  href?: string;
};

/** Binding layout: `docs/EMAIL.md`. Use this for every HTML notification. */
export function composeTransactionalEmail(input: {
  locale?: string;
  preheader?: string;
  eyebrow: string;
  title: string;
  greeting?: string;
  intro?: string;
  details?: EmailDetail[];
  messageLabel?: string;
  message?: string;
  closing?: string;
}): string {
  const bodyHtml = [
    input.greeting ? emailHeading(input.greeting) : "",
    input.intro ? emailParagraph(input.intro) : "",
    input.details ? renderDetailTable(input.details) : "",
    input.messageLabel ? emailParagraph(input.messageLabel) : "",
    input.message ? emailQuote(input.message) : "",
    input.closing ? emailParagraph(input.closing) : "",
  ].join("");

  return renderEmailHtml({
    locale: input.locale,
    preheader: input.preheader ?? input.intro,
    eyebrow: input.eyebrow,
    title: input.title,
    bodyHtml,
  });
}

/** Chrome shell used by `composeTransactionalEmail`. Prefer that helper. */
export function renderEmailHtml(input: {
  locale?: string;
  preheader?: string;
  eyebrow: string;
  title: string;
  bodyHtml: string;
}): string {
  const preheader = input.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.preheader)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="${escapeHtml(input.locale ?? "und")}">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${SHELL};color:${INK};">
    ${preheader}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${SHELL};">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background-color:${PAPER};border:1px solid ${INK};">
            <tr>
              <td style="background-color:${INK};padding:22px 28px;">
                <p style="margin:0;font-family:${SANS};font-size:11px;line-height:14px;letter-spacing:0.16em;text-transform:uppercase;color:${GOLD};font-weight:700;">${escapeHtml(input.eyebrow)}</p>
                <p style="margin:10px 0 0;font-family:${SERIF};font-size:22px;line-height:28px;color:${PAPER};font-weight:normal;word-break:break-word;">${escapeHtml(input.title)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 24px;background-color:${PAPER};">${input.bodyHtml}</td>
            </tr>
            <tr>
              <td style="background-color:${INK};padding:20px 28px;">
                <p style="margin:0;font-family:${SANS};font-size:14px;line-height:22px;color:${PAPER};">${escapeHtml(organization.brandName)}</p>
                <p style="margin:8px 0 0;font-family:${SANS};font-size:13px;line-height:21px;color:${PAPER};">
                  <a href="mailto:${escapeHtml(organization.email)}" style="color:${PAPER};text-decoration:underline;">${escapeHtml(organization.email)}</a><br />
                  <a href="${escapeHtml(organization.phoneHref)}" style="color:${PAPER};text-decoration:underline;">${escapeHtml(organization.phone)}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function emailHeading(text: string): string {
  return `<p style="margin:0 0 12px;font-family:${SERIF};font-size:20px;line-height:26px;color:${INK};">${escapeHtml(text)}</p>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:24px;color:${MUTED};">${escapeHtml(text)}</p>`;
}

export function emailQuote(text: string): string {
  return `<p style="margin:0 0 16px;padding:12px 14px;border-left:2px solid ${INK};font-family:${SANS};font-size:15px;line-height:24px;color:${INK};">${escapeHtml(text).replaceAll("\n", "<br />")}</p>`;
}

export function renderDetailTable(rows: EmailDetail[]): string {
  const visible = rows.filter((row) => row.value.trim().length > 0);

  if (visible.length === 0) {
    return "";
  }

  const cells = visible
    .map((row, index) => {
      const border =
        index === visible.length - 1 ? "0" : `1px solid ${LINE}`;

      return `<tr>
                <td style="padding:12px 14px;border-bottom:${border};">
                  <p style="margin:0 0 4px;font-family:${SANS};font-size:11px;line-height:14px;letter-spacing:0.14em;text-transform:uppercase;color:${SUBTLE};">${escapeHtml(row.label)}</p>
                  <p style="margin:0;font-family:${SANS};font-size:15px;line-height:22px;color:${INK};word-break:break-word;">${
                    row.href
                      ? `<a href="${escapeHtml(row.href)}" style="color:${INK};text-decoration:underline;word-break:break-all;">${escapeHtml(row.value)}</a>`
                      : escapeHtml(row.value)
                  }</p>
                </td>
              </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border:1px solid ${INK};border-collapse:collapse;">${cells}</table>`;
}
