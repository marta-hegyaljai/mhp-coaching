import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {ChargeStatementForm} from "@/features/rooms/components/charge-statement-form";
import {NotificationEvidenceList} from "@/features/rooms/components/notification-evidence-list";
import {StatementAdjustmentForm} from "@/features/rooms/components/statement-adjustment-form";
import {StatementLineList} from "@/features/rooms/components/statement-line-list";
import {statementStatusTone} from "@/features/rooms/components/statement-status";
import {RoomError} from "@/features/rooms/errors";
import {loadStatementNotifications} from "@/features/rooms/notifications";
import {loadStatementDetail} from "@/features/rooms/statements";
import {formatMonthYear} from "@/shared/format/calendar-date";
import {formatLocalDate} from "@/features/rooms/timezone";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {DownloadIcon} from "@/shared/ui/icons";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Price} from "@/shared/ui/price";
import {StatusLabel} from "@/shared/ui/status-label";

type AdminStatementPageProps = {
  params: Promise<{locale: AppLocale; userId: string; id: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminStatementPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  return buildPageMetadata({
    locale,
    title: t("statementDetailTitle"),
    description: t("billingIntro"),
    hrefForLocale: () => "/admin/billing",
    robots: {index: false, follow: false},
  });
}

export default async function AdminStatementPage({params}: AdminStatementPageProps) {
  const {locale, userId, id} = await params;
  setRequestLocale(locale);
  const actor = await requireAdmin(
    locale,
    localizedPath(locale, {
      pathname: "/admin/billing/[userId]/statements/[id]",
      params: {userId, id},
    }),
  );
  const t = await getTranslations("Admin");
  const rooms = await getTranslations("Rooms");

  let detail;
  try {
    detail = await loadStatementDetail({actor, statementId: id});
  } catch (error) {
    if (error instanceof RoomError && error.code === "notFound") {
      notFound();
    }
    throw error;
  }

  if (detail.statement.userId !== userId) {
    notFound();
  }

  const monthLabel = formatMonthYear(
    formatLocalDate(detail.statement.year, detail.statement.month, 1),
    locale,
  );

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
          href={{pathname: "/admin/billing/[userId]", params: {userId}}}
          className="mt-6"
        >
          {t("backToUserBilling")}
        </BackLink>
        <h1 className="mt-5 font-serif text-heading capitalize">{monthLabel}</h1>
        <p className="mt-3 font-sans text-sm break-all">{detail.owner.email}</p>
        <StatusLabel
          className="mt-4"
          tone={statementStatusTone(detail.statement.status)}
        >
          {rooms(`statementStatus.${detail.statement.status}`)}
        </StatusLabel>
        {detail.statement.status === "PAYMENT_FAILED" ? (
          <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">{t("paymentFailedHelp")}</p>
        ) : null}
        {detail.statement.status === "PAYMENT_PENDING" ? (
          <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">{t("paymentPendingHelp")}</p>
        ) : null}
        <p className="mt-6">
          <Price size="lg">
            {formatChf(minorUnitsToFrancs(detail.statement.totalMinor), locale)}
          </Price>
        </p>
        <p className="mt-2 font-sans text-sm tabular-nums text-ink-muted">
          {rooms("statementMinutes", {minutes: detail.statement.billedMinutes})}
        </p>
        <p className="mt-8">
          <a
            href={`/api/admin/statements.xlsx?statement=${encodeURIComponent(detail.statement.id)}`}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
          >
            <DownloadIcon />
            {t("statementXlsx")}
          </a>
        </p>
        <section className="mt-12">
          <h2 className="font-serif text-subheading">{rooms("statementLines")}</h2>
          <StatementLineList
            locale={locale}
            lines={detail.lines}
            empty={rooms("statementLinesEmpty")}
          />
        </section>
        {detail.statement.status === "FINALIZED" ? (
          <>
            <ChargeStatementForm
              locale={locale}
              statementId={detail.statement.id}
              userId={userId}
            />
            <StatementAdjustmentForm
              locale={locale}
              statementId={detail.statement.id}
              userId={userId}
            />
          </>
        ) : null}
        {detail.statement.status === "PAYMENT_PENDING" ? (
          <ChargeStatementForm
            locale={locale}
            statementId={detail.statement.id}
            userId={userId}
            mode="resume"
          />
        ) : null}
        {detail.statement.status === "PAYMENT_FAILED" ? (
          <ChargeStatementForm
            locale={locale}
            statementId={detail.statement.id}
            userId={userId}
            mode="retry"
          />
        ) : null}
        <section className="mt-12">
          <h2 className="font-serif text-subheading">{t("notificationEvidenceTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
            {t("notificationEvidenceHelp")}
          </p>
          <NotificationEvidenceList
            rows={await loadStatementNotifications({actor, statementId: detail.statement.id})}
            empty={t("notificationEvidenceEmpty")}
          />
        </section>
      </Section>
    </SiteShell>
  );
}
