import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {requireRoomBooking} from "@/features/auth/require";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {startPaymentMethodSetupAction} from "@/features/rooms/billing-actions";
import {RoomsNav} from "@/features/rooms/components/rooms-nav";
import {StatementLineList} from "@/features/rooms/components/statement-line-list";
import {loadStatementDetail} from "@/features/rooms/statements";
import {RoomError} from "@/features/rooms/errors";
import {formatMonthYear} from "@/shared/format/calendar-date";
import {formatLocalDate} from "@/features/rooms/timezone";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {BackLink} from "@/shared/ui/back-link";
import {Price} from "@/shared/ui/price";
import {StatusLabel} from "@/shared/ui/status-label";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type StatementPageProps = {
  params: Promise<{locale: AppLocale; id: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: StatementPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});

  return buildPageMetadata({
    locale,
    title: t("statementTitle"),
    description: t("statementsHelp"),
    hrefForLocale: () => "/billing",
    robots: {index: false, follow: false},
  });
}

export default async function StatementPage({params}: StatementPageProps) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const user = await requireRoomBooking(
    locale,
    localizedPath(locale, {pathname: "/billing/statements/[id]", params: {id}}),
  );
  const t = await getTranslations("Rooms");

  let detail;
  try {
    detail = await loadStatementDetail({actor: user, statementId: id});
  } catch (error) {
    if (error instanceof RoomError && (error.code === "notFound" || error.code === "forbidden")) {
      notFound();
    }
    throw error;
  }

  const monthLabel = formatMonthYear(
    formatLocalDate(detail.statement.year, detail.statement.month, 1),
    locale,
  );

  return (
    <SiteShell locale={locale} footerCta={null}>
      <WorkspacePage
        eyebrow={t("eyebrow")}
        nav={<RoomsNav current="usage" />}
        back={<BackLink href="/billing">{t("backToBilling")}</BackLink>}
        title={monthLabel}
      >
        <StatusLabel
          className="mt-4"
          tone={detail.statement.status === "OPEN" ? "muted" : "strong"}
        >
          {t(`statementStatus.${detail.statement.status}`)}
        </StatusLabel>
        {detail.statement.status === "PAYMENT_FAILED" ? (
          <div className="mt-6 max-w-xl space-y-4">
            <p className="text-sm leading-7 text-ink-muted">{t("paymentFailedHelp")}</p>
            <form action={startPaymentMethodSetupAction.bind(null, locale)}>
              <Button type="submit">{t("paymentMethodUpdate")}</Button>
            </form>
          </div>
        ) : null}
        {detail.statement.status === "PAYMENT_PENDING" ? (
          <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">{t("paymentPendingHelp")}</p>
        ) : null}
        {detail.statement.status === "PAID" ? (
          <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">{t("paymentPaidHelp")}</p>
        ) : null}
        <p className="mt-6">
          <Price size="lg">
            {formatChf(minorUnitsToFrancs(detail.statement.totalMinor), locale)}
          </Price>
        </p>
        <p className="mt-2 font-sans text-sm tabular-nums text-ink-muted">
          {t("statementMinutes", {minutes: detail.statement.billedMinutes})}
        </p>
        <section className="mt-12">
          <h2 className="font-serif text-subheading">{t("statementLines")}</h2>
          <StatementLineList
            locale={locale}
            lines={detail.lines}
            empty={t("statementLinesEmpty")}
          />
        </section>
      </WorkspacePage>
    </SiteShell>
  );
}
