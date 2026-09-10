import {describe, expect, it} from "vitest";

import {escapeHtml} from "./html";
import {
  composeTransactionalEmail,
  emailHeading,
  renderDetailTable,
  renderEmailHtml,
} from "./layout";
import {mailLocale} from "./locale";

describe("email helpers", () => {
  it("escapes HTML reserved characters", () => {
    expect(escapeHtml(`Ada & "MHP" <script>`)).toBe(
      "Ada &amp; &quot;MHP&quot; &lt;script&gt;",
    );
  });

  it("falls back to French when the booking locale is unknown", () => {
    expect(mailLocale("en")).toBe("en");
    expect(mailLocale("xx")).toBe("fr");
  });
});

describe("email layout", () => {
  it("wraps content in a table-based black and white document", () => {
    const html = renderEmailHtml({
      locale: "fr",
      preheader: "Votre place est confirmée.",
      eyebrow: "Inscription confirmée",
      title: "Praticien·ne en Hypnose OMNI®",
      bodyHtml: emailHeading("Bonjour Ada,"),
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('lang="fr"');
    expect(html).toContain("role=\"presentation\"");
    expect(html).toContain("#090909");
    expect(html).toContain("#ffffff");
    expect(html).toContain("#c8aa6a");
    expect(html).toContain("Georgia");
    expect(html).toContain("Arial");
    expect(html).toContain("Praticien·ne en Hypnose OMNI®");
    expect(html).toContain("contact@mhp-coaching.ch");
    expect(html).not.toContain("<script>");
  });

  it("escapes untrusted copy in the chrome", () => {
    const html = renderEmailHtml({
      eyebrow: `MHP <img src=x>`,
      title: `OMNI & "test"`,
      bodyHtml: "",
    });

    expect(html).toContain("MHP &lt;img src=x&gt;");
    expect(html).toContain("OMNI &amp; &quot;test&quot;");
    expect(html).not.toContain("<img src=x>");
  });

  it("renders a compact labelled details table", () => {
    const html = renderDetailTable([
      {label: "Formation", value: "OMNI"},
      {label: "Montant payé", value: "CHF 3’490.00"},
    ]);

    expect(html).toContain("Formation");
    expect(html).toContain("OMNI");
    expect(html).toContain("CHF 3’490.00");
    expect(html).toContain("border:1px solid #090909");
  });

  it("composes greeting, details and footer through the shared chrome", () => {
    const html = composeTransactionalEmail({
      locale: "fr",
      eyebrow: "Inscription confirmée",
      title: "OMNI",
      greeting: "Bonjour Ada,",
      intro: "Votre place est confirmée.",
      details: [{label: "Formation", value: "OMNI"}],
      closing: "À bientôt.",
    });

    expect(html).toContain("Bonjour Ada,");
    expect(html).toContain("Votre place est confirmée.");
    expect(html).toContain("Formation");
    expect(html).toContain("À bientôt.");
    expect(html).toContain("#c8aa6a");
    expect(html).toContain("role=\"presentation\"");
  });
});
