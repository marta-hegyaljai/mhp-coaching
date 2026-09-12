import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {
  BillingPeriodPicker,
  billingPeriodSearch,
} from "@/features/rooms/components/billing-period-picker";
import {
  UsageMonthBanner,
  UsageTotals,
} from "@/features/rooms/components/usage-panels";
import {emptyUserUsage, loadMonthUsage} from "@/features/rooms/usage";
import {loadMonthStatements} from "@/features/rooms/statements";
import {listRoomBillableUsers, listStatementsByStatuses} from "@/features/rooms/statement-repository";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {formatLocalDate} from "@/features/rooms/timezone";
import {formatMonthYear} from "@/shared/format/calendar-date";
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
import {StatusLabel} from "@/shared/ui/status-label";

type AdminBillingPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    q?: string | string[];
    month?: string | string[];
    from?: string | string[];
    to?: string | string[];
    year?: string | string[];
  }>;
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
  const monthParam = firstString((await searchParams).month).trim();
  const fromParam = firstString((await searchParams).from).trim();
  const toParam = firstString((await searchParams).to).trim();
  const yearParam = firstString((await searchParams).year).trim();
  const yearPeriod =
    /^\d{4}$/.test(yearParam)
      ? {from: `${yearParam}-01`, to: `${yearParam}-12`}
      : null;
  const actor = await requireAdmin(
    locale,
    localizedPath(locale, {
      pathname: "/admin/billing",
      query: {
        q: query || undefined,
        month: monthParam || undefined,
        from: fromParam || yearPeriod?.from || undefined,
        to: toParam || yearPeriod?.to || undefined,
      },
    }),
  );
  const t = await getTranslations("Admin");
  const rooms = await getTranslations("Rooms");
  const report = await loadMonthUsage({
    actor,
    month: monthParam || undefined,
    from: fromParam || yearPeriod?.from || undefined,
    to: toParam || yearPeriod?.to || undefined,
  });
  const selected = report.from;
  const statements = report.singleMonth && !report.open
    ? await loadMonthStatements({actor, month: selected})
    : [];
  const failedStatements = (await listStatementsByStatuses(["PAYMENT_FAILED"]))
    .filter((statement) => {
      const index = statement.year * 12 + statement.month;
      return (
        index >= report.from.year * 12 + report.from.month &&
        index <= report.to.year * 12 + report.to.month
      );
    });
  const needle = query.toLowerCase();
  let users = report.users;
  if (needle) {
    const billable = await listRoomBillableUsers();
    const usageById = new Map(report.users.map((user) => [user.userId, user]));
    users = billable
      .filter((owner) =>
        `${owner.email} ${owner.firstName} ${owner.lastName}`.toLowerCase().includes(needle),
      )
      .map((owner) => usageById.get(owner.id) ?? emptyUserUsage(owner));
  }
  const periodQuery = [
    `from=${encodeURIComponent(report.fromKey)}`,
    `to=${encodeURIComponent(report.toKey)}`,
  ].join("&");
  const periodSearch = billingPeriodSearch(report.from, report.to);

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="billing"
          label={t("sectionsNav")}
          labels={adminSectionLabels(t)}
        />
        <h1 className="mt-6 font-serif text-heading">
          {report.singleMonth
            ? report.open
              ? t("billingTitle")
              : t("billingClosedTitle")
            : t("billingRangeTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
          {report.singleMonth
            ? report.open
              ? t("billingIntro")
              : t("billingClosedIntro")
            : t("billingRangeIntro")}
        </p>
        <p className="mt-4">
          <Link href="/admin/notifications" className="text-sm font-semibold underline-offset-4 hover:underline">
            {t("notificationsLink")}
          </Link>
        </p>
        <BillingPeriodPicker
          locale={locale}
          action={localizedPath(locale, "/admin/billing")}
          from={report.from}
          to={report.to}
          hidden={{q: query || undefined}}
          hrefFor={(fromMonth, toMonth) => ({
            pathname: "/admin/billing",
            query: {
              q: query || undefined,
              ...billingPeriodSearch(fromMonth, toMonth),
            },
          })}
        />
        {report.singleMonth ? (
          <UsageMonthBanner
            locale={locale}
            year={report.year}
            month={report.month}
            open={report.open}
          />
        ) : (
          <p className="mt-8 font-sans text-sm tabular-nums text-ink-muted">
            {t("billingPeriodSelected", {from: report.fromKey, to: report.toKey})}
          </p>
        )}
        <UsageTotals
          locale={locale}
          billedMinutes={report.billedMinutes}
          billedAmountMinor={report.billedAmountMinor}
          bookingCount={report.bookingCount}
        />

        {failedStatements.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-serif text-subheading">{t("failedPaymentsTitle")}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{t("failedPaymentsHelp")}</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {failedStatements.map((statement) => (
                <li key={statement.id}>
                  <Link
                    href={{
                      pathname: "/admin/billing/[userId]/statements/[id]",
                      params: {userId: statement.userId, id: statement.id},
                    }}
                    className="block h-full rounded-panel border border-ink bg-white p-5 transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    <StatusLabel>{rooms(`statementStatus.${statement.status}`)}</StatusLabel>
                    <p className="mt-3 font-serif text-[clamp(1.15rem,1.4vw,1.35rem)] capitalize leading-[1.15]">
                      {formatMonthYear(formatLocalDate(statement.year, statement.month, 1), locale)}
                    </p>
                    <p className="mt-4">
                      <Price size="sm">
                        {formatChf(minorUnitsToFrancs(statement.totalMinor), locale)}
                      </Price>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-10">
          <FilterBar
            action={localizedPath(locale, "/admin/billing")}
            label={t("filter")}
            columnsClassName="sm:grid-cols-[minmax(0,1fr)_auto]"
            actions={
              <>
                {report.singleMonth && !report.open ? (
                  <>
                    <input type="hidden" name="from" value={report.fromKey} />
                    <input type="hidden" name="to" value={report.toKey} />
                  </>
                ) : report.singleMonth ? null : (
                  <>
                    <input type="hidden" name="from" value={report.fromKey} />
                    <input type="hidden" name="to" value={report.toKey} />
                  </>
                )}
                <Button type="submit" variant="secondary">
                  {t("filter")}
                </Button>
                {query ? (
                  <Link
                    href={{
                      pathname: "/admin/billing",
                      query: periodSearch,
                    }}
                    className="text-sm underline-offset-4 hover:underline"
                  >
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

        <p className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
          <a
            href={`/api/admin/billing.xlsx?${periodQuery}`}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
          >
            <DownloadIcon />
            {t("billingXlsx")}
          </a>
          {report.open && report.singleMonth ? null : (
            <a
              href={`/api/admin/statements.xlsx?${periodQuery}`}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
            >
              <DownloadIcon />
              {t("statementsXlsx")}
            </a>
          )}
        </p>

        {users.length === 0 ? (
          <Panel className="mt-8 max-w-xl">
            <p className="text-sm leading-7 text-ink-muted">{t("billingEmpty")}</p>
          </Panel>
        ) : (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {users.map((user) => {
              const statement = statements.find((row) => row.userId === user.userId);
              return (
                <li key={user.userId}>
                  <Link
                    href={{
                      pathname: "/admin/billing/[userId]",
                      params: {userId: user.userId},
                      query: periodSearch,
                    }}
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
                    {statement ? (
                      <p className="mt-3 text-[0.7rem] font-bold uppercase tracking-[0.2em]">
                        {rooms(`statementStatus.${statement.status}`)}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </SiteShell>
  );
}
