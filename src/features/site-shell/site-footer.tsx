import {getTranslations} from "next-intl/server";
import type {ComponentProps} from "react";

import {ContactLinks} from "@/features/organization/contact-links";
import {organization} from "@/features/organization/info";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Container} from "@/shared/ui/layout";

const footerLink =
  "inline-flex min-h-9 items-center text-sm text-ink-muted underline-offset-4 transition-colors duration-150 hover:text-ink hover:underline";

/** Closing call to action; pass `null` on pages that already are the offer. */
export type FooterCta = {
  href: ComponentProps<typeof Link>["href"];
  label: string;
};

export async function SiteFooter({
  locale,
  cta,
}: {
  locale: AppLocale;
  cta?: FooterCta | null;
}) {
  const t = await getTranslations({locale, namespace: "Footer"});
  const nav = await getTranslations({locale, namespace: "Nav"});
  const address = organization.addresses.headquarters;
  const band =
    cta === null ? null : (cta ?? {href: "/courses", label: t("ctaButton")});

  return (
    <footer className={band ? "" : "mt-20 sm:mt-28"}>
      {band ? (
        <section className="border-y border-ink bg-ink text-parchment">
          <Container className="flex flex-col gap-8 py-14 sm:py-20 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-parchment/65">
                {t("ctaEyebrow")}
              </p>
              <h2 className="mt-4 font-serif text-heading">{t("ctaTitle")}</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-parchment/75">
                {t("ctaBody")}
              </p>
            </div>
            <Link
              href={band.href}
              className={`${buttonStyles({variant: "invert", size: "lg"})} w-full shrink-0 sm:w-auto`}
            >
              {band.label}
              <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
            </Link>
          </Container>
        </section>
      ) : (
        <div className="border-t border-line" />
      )}

      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-sans text-subheading font-semibold">MHP Coaching</p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-ink-muted">
            {t("tagline")}
          </p>
        </div>
        <nav aria-label={t("navigation")}>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink">
            {t("navigation")}
          </p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/courses" className={footerLink}>
                {nav("courses")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className={footerLink}>
                {nav("contact")}
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink">
            {t("visit")}
          </p>
          <p className="mt-3 text-sm leading-7 text-ink-muted">
            MHP Coaching
            <br />
            {address.street}
            <br />
            {address.postalCode} {address.city}
            <br />
            {address.countryName[locale]}
          </p>
          <ContactLinks className="mt-3 text-sm" linkClassName={footerLink} />
        </div>
        <nav aria-label={t("legal")}>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink">
            {t("legal")}
          </p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/legal/imprint" className={footerLink}>
                {t("imprint")}
              </Link>
            </li>
            <li>
              <Link href="/legal/privacy" className={footerLink}>
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/legal/terms" className={footerLink}>
                {t("terms")}
              </Link>
            </li>
          </ul>
        </nav>
      </Container>

      <div className="border-t border-line-soft">
        <Container className="py-5">
          <p className="text-xs text-ink-subtle">
            {t("copyright", {year: new Date().getFullYear()})}
          </p>
        </Container>
      </div>
    </footer>
  );
}
