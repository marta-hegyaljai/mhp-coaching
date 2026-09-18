import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {CancelCallForm} from "@/features/course-calls/components/cancel-call-form";
import {callPersonName, callWhen} from "@/features/course-calls/format";
import {adminCallListHref} from "@/features/course-calls/query";
import {getCourseCallById} from "@/features/course-calls/repository";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {Panel} from "@/shared/ui/panel";
import {StatusLabel} from "@/shared/ui/status-label";
import {WorkspacePage} from "@/shared/ui/workspace-page";
import {isUuid} from "@/lib/uuid";

type AdminCallPageProps = {
  params: Promise<{locale: AppLocale; id: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminCallPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  return buildPageMetadata({
    locale,
    title: t("callDetailTitle"),
    description: t("callsIntro"),
    hrefForLocale: () => "/admin/calls",
    robots: {index: false, follow: false},
  });
}

export default async function AdminCallDetailPage({params}: AdminCallPageProps) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  await requireAdmin(
    locale,
    localizedPath(locale, {pathname: "/admin/calls/[id]", params: {id}}),
  );
  if (!isUuid(id)) {
    notFound();
  }
  const call = await getCourseCallById(id);
  if (!call) {
    notFound();
  }

  const t = await getTranslations("Admin");
  const when = callWhen(call.startsAt, call.endsAt, locale);
  const name = callPersonName(call.firstName, call.lastName);

  return (
    <SiteShell locale={locale} footerCta={null}>
      <WorkspacePage
        eyebrow={t("eyebrow")}
        nav={
          <AdminSubnav
            current="calls"
            label={t("sectionsNav")}
            labels={adminSectionLabels(t)}
          />
        }
        back={<BackLink href={adminCallListHref()}>{t("callsBack")}</BackLink>}
        title={name}
      >
        <StatusLabel
          className="mt-2"
          tone={call.status === "SCHEDULED" ? "ok" : "stop"}
        >
          {call.status === "SCHEDULED" ? t("callStatusScheduled") : t("callStatusCancelled")}
        </StatusLabel>

        <Panel className="mt-8 max-w-xl">
          <dl className="space-y-5 text-sm">
            <Fact label={t("callWhen")} value={`${when.weekdayDate} · ${when.timeLabel}`} />
            <Fact label={t("email")} value={call.email} />
            <Fact label={t("callPhone")} value={call.phone} />
            <Fact label={t("callCourse")} value={call.courseTitle ?? t("callGeneral")} />
            {call.message ? <Fact label={t("callMessage")} value={call.message} /> : null}
          </dl>
        </Panel>

        {call.status === "SCHEDULED" ? (
          <div className="mt-10 max-w-xl">
            <h2 className="font-serif text-subheading">{t("callCancelTitle")}</h2>
            <div className="mt-4">
              <CancelCallForm locale={locale} callId={call.id} />
            </div>
          </div>
        ) : null}
      </WorkspacePage>
    </SiteShell>
  );
}

function Fact({label, value}: {label: string; value: string}) {
  return (
    <div>
      <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-ink">{value}</dd>
    </div>
  );
}
