import {getTranslations, setRequestLocale} from "next-intl/server";

import {listBookings} from "@/features/bookings/repository";
import {StaffBookingsTable} from "@/features/staff/bookings-table";
import {StaffWaitlistTable} from "@/features/staff/waitlist-table";
import {listWaitlistEntries} from "@/features/waitlist/repository";
import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {Section} from "@/shared/ui/layout";

type StaffPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: StaffPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Staff"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("intro"),
    hrefForLocale: () => "/staff/bookings",
    robots: {index: false, follow: false},
  });
}

export default async function StaffBookingsPage({params}: StaffPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Staff");
  const bookings = await listBookings();
  const waitlist = await listWaitlistEntries();

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-heading">{t("title")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
              {t("intro")}
            </p>
          </div>
          <a
            href="/api/staff/bookings.csv"
            className={buttonStyles({variant: "secondary"})}
          >
            {t("csv")}
          </a>
        </div>
        <div className="mt-10">
          <StaffBookingsTable
            bookings={bookings}
            labels={{
              name: t("name"),
              email: t("email"),
              course: t("course"),
              date: t("date"),
              amount: t("amount"),
              status: t("status"),
              created: t("created"),
              paid: t("paid"),
              empty: t("empty"),
            }}
          />
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-ink pt-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-subheading">{t("waitlistTitle")}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
              {t("waitlistIntro")}
            </p>
          </div>
          <a
            href="/api/staff/waitlist.csv"
            className={buttonStyles({variant: "secondary"})}
          >
            {t("waitlistCsv")}
          </a>
        </div>
        <div className="mt-8">
          <StaffWaitlistTable
            entries={waitlist}
            labels={{
              name: t("name"),
              email: t("email"),
              phone: t("phone"),
              course: t("course"),
              created: t("created"),
              empty: t("waitlistEmpty"),
            }}
          />
        </div>
      </Section>
    </SiteShell>
  );
}
