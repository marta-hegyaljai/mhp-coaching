import {getTranslations} from "next-intl/server";

import {ContactLinks} from "@/features/organization/contact-links";
import {organization} from "@/features/organization/info";
import type {PathnameHref} from "@/i18n/href";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Container} from "@/shared/ui/layout";

import {primaryNavEntries} from "./nav-model";
import {OriginLink} from "./origin-link";

const footerLink =
  "inline-flex min-h-9 items-center text-sm text-parchment/70 underline-offset-4 transition-colors duration-150 hover:text-parchment hover:underline";

const footerEyebrow =
  "text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold";

/** Closing call to action; pass `null` on pages that already are the offer. */
export type FooterCta = {
  href: PathnameHref;
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
    <footer className={`bg-ink text-parchment ${band ? "" : "mt-16 sm:mt-24"}`}>
      {band ? (
        <section aria-labelledby="footer-cta-title">
          <Container className="flex flex-col gap-6 py-10 sm:py-12 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div className="max-w-2xl">
              <p className={footerEyebrow}>{t("ctaEyebrow")}</p>
              <h2 id="footer-cta-title" className="mt-3 font-serif text-heading">
                {t("ctaTitle")}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-parchment/70 sm:text-base">
                {t("ctaBody")}
              </p>
            </div>
            <OriginLink
              locale={locale}
              origin="marketing"
              href={band.href}
              className={`${buttonStyles({variant: "invert", size: "lg"})} w-full shrink-0 sm:w-auto`}
            >
              {band.label}
              <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
            </OriginLink>
          </Container>
        </section>
      ) : null}

      <div className={band ? "border-t border-parchment/20" : ""}>
        <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-sans text-subheading font-semibold">MHP Coaching</p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-parchment/70">
              {t("tagline")}
            </p>
          </div>
          <nav aria-label={t("navigation")}>
            <p className={footerEyebrow}>{t("navigation")}</p>
            <ul className="mt-3 space-y-1">
              {primaryNavEntries(null).map((entry) => (
                <li key={entry.key}>
                  <OriginLink
                    locale={locale}
                    origin={entry.origin}
                    href={entry.href}
                    className={footerLink}
                  >
                    {nav(entry.key)}
                  </OriginLink>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className={footerEyebrow}>{t("visit")}</p>
            <p className="mt-3 text-sm leading-7 text-parchment/70">
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
            <p className={footerEyebrow}>{t("legal")}</p>
            <ul className="mt-3 space-y-1">
              <li>
                <OriginLink locale={locale} origin="marketing" href="/legal/imprint" className={footerLink}>
                  {t("imprint")}
                </OriginLink>
              </li>
              <li>
                <OriginLink locale={locale} origin="marketing" href="/legal/terms-of-use" className={footerLink}>
                  {t("termsOfUse")}
                </OriginLink>
              </li>
              <li>
                <OriginLink locale={locale} origin="marketing" href="/legal/terms" className={footerLink}>
                  {t("terms")}
                </OriginLink>
              </li>
              <li>
                <OriginLink locale={locale} origin="marketing" href="/legal/privacy" className={footerLink}>
                  {t("privacy")}
                </OriginLink>
              </li>
              <li>
                <OriginLink locale={locale} origin="marketing" href="/legal/copyright" className={footerLink}>
                  {t("copyrightNotice")}
                </OriginLink>
              </li>
            </ul>
          </nav>
        </Container>
      </div>

      <div className="border-t border-parchment/15">
        <Container className="py-5">
          <p className="text-xs text-parchment/55">
            {t("copyright", {year: new Date().getFullYear()})}
          </p>
        </Container>
      </div>
    </footer>
  );
}
