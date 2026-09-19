import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {AdminWorkspace} from "@/features/admin/components/admin-workspace";
import {requireAdmin} from "@/features/auth/require";
import {adminCallListHref} from "@/features/course-calls/query";
import {
  findAdminMessage,
  parseAdminMessageChannel,
} from "@/features/inquiries/admin-message";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {Panel} from "@/shared/ui/panel";
import {WorkspacePage} from "@/shared/ui/workspace-page";
import {isUuid} from "@/lib/uuid";
import {formatLongDate} from "@/shared/format/calendar-date";
import {utcToZurich} from "@/features/rooms/timezone";
import {StatusLabel, statusRailClass} from "@/shared/ui/status-label";

type AdminInquiryPageProps = {
  params: Promise<{locale: AppLocale; id: string}>;
  searchParams: Promise<{channel?: string | string[]}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminInquiryPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  return buildPageMetadata({
    locale,
    title: t("inquiryDetailTitle"),
    description: t("callsIntro"),
    hrefForLocale: () => "/admin/calls",
    robots: {index: false, follow: false},
  });
}

export default async function AdminInquiryDetailPage({
  params,
  searchParams,
}: AdminInquiryPageProps) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const channel = parseAdminMessageChannel((await searchParams).channel);
  await requireAdmin(
    locale,
    localizedPath(locale, {
      pathname: "/admin/calls/messages/[id]",
      params: {id},
      query: channel === "course" ? undefined : {channel},
    }),
  );
  if (!isUuid(id)) {
    notFound();
  }
  const message = await findAdminMessage(id, channel);
  if (!message) {
    notFound();
  }

  const t = await getTranslations("Admin");
  const received = utcToZurich(message.receivedAt);

  return (
    <AdminWorkspace locale={locale} current="calls">
      <WorkspacePage
        back={
          <BackLink href={adminCallListHref({tab: "messages"})}>{t("callsBack")}</BackLink>
        }
        title={message.name}
      >
        <StatusLabel className="mt-4" tone="gold">
          {t(`activityMessageTopics.${message.topic}`)}
        </StatusLabel>
        <p className="mt-3 text-sm text-ink-muted">
          {formatLongDate(received.date, locale)} · {received.time}
        </p>

        <Panel className={`mt-8 max-w-xl ${statusRailClass("gold")}`}>
          <dl className="space-y-5 text-sm">
            <div>
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                {t("email")}
              </dt>
              <dd className="mt-1 break-all text-ink">{message.email}</dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                {t("callPhone")}
              </dt>
              <dd className="mt-1 text-ink">{message.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                {t("callCourse")}
              </dt>
              <dd className="mt-1 text-ink">
                {message.courseTitle ?? t("callGeneral")}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                {t("callMessage")}
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-ink">{message.message}</dd>
            </div>
          </dl>
        </Panel>
      </WorkspacePage>
    </AdminWorkspace>
  );
}
