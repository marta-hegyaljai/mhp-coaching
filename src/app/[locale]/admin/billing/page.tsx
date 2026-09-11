import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {
  UsageMonthBanner,
  UsageTotals,
} from "@/features/rooms/components/usage-panels";
import {loadOpenMonthUsage} from "@/features/rooms/usage";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {InputField} from "@/shared/ui/field";
import {FilterBar} from "@/shared/ui/filter-bar";
import {DownloadIcon} from "@/shared/ui/icons";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";
import {Price} from "@/shared/ui/price";

type AdminBillingPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{q?: string | string[]}>;
};

export const dynamic = "force-dynamic";

function firstString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export async function generateMetadata({params}: AdminBillingPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  return buildPageMetadata({
    locale,
    title: t("billingTitle"),
    description: t("billingIntro"),
    hrefForLocale: () => "/admin/billing",
    robots: {index: false, follow: false},
  });
}

export default async function AdminBillingPage({params, searchParams}: AdminBillingPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const query = firstString((await searchParams).q).trim();
  const actor = await requireAdmin(
    locale,
    localizedPath(locale, {
      pathname: "/admin/billing",
      query: query ? {q: query} : undefined,
    }),
  );
  const t = await getTranslations("Admin");
  const rooms = await getTranslations("Rooms");
  const report = await loadOpenMonthUsage({actor});
  const needle = query.toLowerCase();
  const users = needle
    ? report.users.filter((user) =>
        `${user.email} ${user.firstName} ${user.lastName}`.toLowerCase().includes(needle),
      )
    : report.users;

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="billing"
          label={t("sectionsNav")}
          labels={adminSectionLabels(t)}
        />
        <h1 className="mt-6 font-serif text-heading">{t("billingTitle")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{t("billingIntro")}</p>
        <UsageMonthBanner locale={locale} year={report.year} month={report.month} />
        <UsageTotals
          locale={locale}
          billedMinutes={report.billedMinutes}
          billedAmountMinor={report.billedAmountMinor}
          bookingCount={report.bookingCount}
        />

        <div className="mt-10">
          <FilterBar
            action={localizedPath(locale, "/admin/billing")}
            label={t("filter")}
            columnsClassName="sm:grid-cols-[minmax(0,1fr)_auto]"
            actions={
              <>
                <Button type="submit" variant="secondary">
                  {t("filter")}
                </Button>
                {query ? (
                  <Link href="/admin/billing" className="text-sm underline-offset-4 hover:underline">
                    {t("clearFilters")}
                  </Link>
                ) : null}
              </>
            }
          >
            <InputField
              id="q"
              name="q"
              size="sm"
              defaultValue={query}
              label={t("searchBilling")}
              placeholder={t("searchBillingPlaceholder")}
            />
          </FilterBar>
        </div>

        <p className="mt-6">
          <a
            href="/api/admin/billing.csv"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
          >
            <DownloadIcon />
            {t("billingCsv")}
          </a>
        </p>

        {users.length === 0 ? (
          <Panel className="mt-8 max-w-xl">
            <p className="text-sm leading-7 text-ink-muted">{t("billingEmpty")}</p>
          </Panel>
        ) : (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {users.map((user) => (
              <li key={user.userId}>
                <Link
                  href={{pathname: "/admin/billing/[userId]", params: {userId: user.userId}}}
                  className="block h-full rounded-panel border border-ink bg-white p-5 transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <p className="font-sans text-sm font-medium break-all">{user.email}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {user.firstName} {user.lastName}
                    {user.currentDiscountPercent > 0
                      ? ` · ${rooms("bookDiscount", {percent: user.currentDiscountPercent})}`
                      : ""}
                  </p>
                  <p className="mt-4 font-sans text-sm tabular-nums text-ink-muted">
                    {rooms("usageRoomMeta", {
                      minutes: user.billedMinutes,
                      count: user.bookingCount,
                    })}
                  </p>
                  <p className="mt-3">
                    <Price size="sm">
                      {formatChf(minorUnitsToFrancs(user.billedAmountMinor), locale)}
                    </Price>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </SiteShell>
  );
}
