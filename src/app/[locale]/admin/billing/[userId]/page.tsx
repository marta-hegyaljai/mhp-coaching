import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {findUserById} from "@/features/auth/repository";
import {requireAdmin} from "@/features/auth/require";
import {FinalizeStatementForm} from "@/features/rooms/components/finalize-statement-form";
import {
  BillingPeriodPicker,
  billingPeriodSearch,
} from "@/features/rooms/components/billing-period-picker";
import {StatementCardGrid} from "@/features/rooms/components/statement-card-grid";
import {
  UsageLineList,
  UsageMonthBanner,
  UsageRoomGrid,
  UsageTotals,
} from "@/features/rooms/components/usage-panels";
import {formatPaymentMethodLabel, paymentMethodFromUser} from "@/features/payments/billing-method";
import {previewFinalize, loadUserStatements} from "@/features/rooms/statements";
import {emptyUserUsage, loadMonthUsage} from "@/features/rooms/usage";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {DownloadIcon} from "@/shared/ui/icons";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";
import {StatusLabel} from "@/shared/ui/status-label";

type AdminBillingUserPageProps = {
  params: Promise<{locale: AppLocale; userId: string}>;
  searchParams: Promise<{month?: string | string[]; from?: string | string[]; to?: string | string[]}>;
};

export const dynamic = "force-dynamic";

function firstString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export async function generateMetadata({params}: AdminBillingUserPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  return buildPageMetadata({
    locale,
    title: t("billingUserTitle"),
    description: t("billingIntro"),
    hrefForLocale: () => "/admin/billing",
    robots: {index: false, follow: false},
  });
}

export default async function AdminBillingUserPage({params, searchParams}: AdminBillingUserPageProps) {
  const {locale, userId} = await params;
  const monthParam = firstString((await searchParams).month).trim();
  const fromParam = firstString((await searchParams).from).trim();
  const toParam = firstString((await searchParams).to).trim();
  setRequestLocale(locale);
  const actor = await requireAdmin(
    locale,
    localizedPath(locale, {
      pathname: "/admin/billing/[userId]",
      params: {userId},
      query: {
        month: monthParam || undefined,
        from: fromParam || undefined,
        to: toParam || undefined,
      },
    }),
  );
  const t = await getTranslations("Admin");
  const rooms = await getTranslations("Rooms");
  const user = await findUserById(userId);
  if (!user) {
    notFound();
  }

  const report = await loadMonthUsage({
    actor,
    userId,
    month: monthParam || undefined,
    from: fromParam || undefined,
    to: toParam || undefined,
  });
  const usage = report.users[0] ?? emptyUserUsage(user);
  const preview = report.singleMonth
    ? await previewFinalize({
        actor,
        userId,
        month: report.from,
      })
    : null;
  const statements = await loadUserStatements({actor, userId});
  const paymentMethod = paymentMethodFromUser(user);
  const periodSearch = billingPeriodSearch(report.from, report.to);
  const periodQuery = [
    `user=${encodeURIComponent(user.id)}`,
    `from=${encodeURIComponent(report.fromKey)}`,
    `to=${encodeURIComponent(report.toKey)}`,
  ].join("&");

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="billing"
          label={t("sectionsNav")}
          labels={adminSectionLabels(t)}
        />
        <BackLink
          href={{
            pathname: "/admin/billing",
            query: periodSearch,
          }}
          className="mt-6"
        >
          {t("backToBilling")}
        </BackLink>
        <h1 className="mt-5 font-serif text-heading">{t("billingUserTitle")}</h1>
        <p className="mt-4 font-sans text-lg font-medium break-all">{user.email}</p>
        <p className="mt-2 text-sm leading-7 text-ink-muted">
          {user.firstName} {user.lastName}
          {user.roomDiscountPercent > 0
            ? ` · ${rooms("bookDiscount", {percent: user.roomDiscountPercent})}`
            : ""}
        </p>
        <p className="mt-3">
          <Link
            href={{pathname: "/admin/users/[id]", params: {id: user.id}}}
            className="text-sm underline-offset-4 hover:underline"
          >
            {t("manageUser")}
          </Link>
        </p>
        <Panel className="mt-8 max-w-xl" padding="sm">
          <StatusLabel>
            {paymentMethod ? t("paymentMethodSaved") : t("paymentMethodMissing")}
          </StatusLabel>
          <p className="mt-3 font-sans text-sm tabular-nums leading-6">
            {paymentMethod
              ? formatPaymentMethodLabel(paymentMethod)
              : t("paymentMethodMissingHelp")}
          </p>
        </Panel>
        <BillingPeriodPicker
          locale={locale}
          action={localizedPath(locale, {
            pathname: "/admin/billing/[userId]",
            params: {userId},
          })}
          from={report.from}
          to={report.to}
          hrefFor={(fromMonth, toMonth) => ({
            pathname: "/admin/billing/[userId]",
            params: {userId},
            query: billingPeriodSearch(fromMonth, toMonth),
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
        {usage.bookingCount > 0 ? (
          <>
            <UsageTotals
              locale={locale}
              billedMinutes={usage.billedMinutes}
              billedAmountMinor={usage.billedAmountMinor}
              bookingCount={usage.bookingCount}
            />
            <UsageRoomGrid locale={locale} rooms={usage.rooms} />
            <UsageLineList
              locale={locale}
              lines={usage.lines}
              empty={t("billingUserEmpty")}
              hrefForLine={(line) => ({
                pathname: "/admin/bookings/[id]",
                params: {id: line.bookingId},
              })}
            />
          </>
        ) : (
          <Panel className="mt-10 max-w-xl">
            <p className="text-sm leading-7 text-ink-muted">{t("billingUserEmpty")}</p>
          </Panel>
        )}

        <p className="mt-10">
          <a
            href={`/api/admin/billing.xlsx?${periodQuery}`}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
          >
            <DownloadIcon />
            {t("billingUserXlsx")}
          </a>
        </p>

        {preview ? (
        <section className="mt-12 max-w-xl">
          <h2 className="font-serif text-subheading">{t("finalizeTitle")}</h2>
          <p className="mt-3 text-sm leading-7 text-ink-muted">
            {preview.alreadyFinalized
              ? t("alreadyFinalizedHelp")
              : preview.open
                ? t("cannotFinalizeOpen")
                : t("finalizeHelp")}
          </p>
          {preview.warnings.includes("noPaymentMethod") ? (
            <p className="mt-3 text-sm leading-7 text-ink-muted">{t("finalizeNoMethod")}</p>
          ) : null}
          {preview.warnings.includes("zeroTotal") && !preview.open ? (
            <p className="mt-3 text-sm leading-7 text-ink-muted">{t("finalizeZeroTotal")}</p>
          ) : null}
          <FinalizeStatementForm
            locale={locale}
            userId={user.id}
            monthKey={preview.monthKey}
            disabled={!preview.canFinalize}
          />
        </section>
        ) : (
          <p className="mt-12 max-w-xl text-sm leading-7 text-ink-muted">
            {t("finalizeNeedsSingleMonth")}
          </p>
        )}

        <section className="mt-12">
          <h2 className="font-serif text-subheading">{rooms("statementsTitle")}</h2>
          <StatementCardGrid
            locale={locale}
            statements={statements}
            empty={rooms("statementsEmpty")}
            hrefFor={(statement) => ({
              pathname: "/admin/billing/[userId]/statements/[id]",
              params: {userId, id: statement.id},
            })}
          />
        </section>
      </Section>
    </SiteShell>
  );
}
