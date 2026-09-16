import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {callPersonName} from "@/features/course-calls/format";
import {adminCallListHref} from "@/features/course-calls/query";
import {getCourseInquiryById} from "@/features/course-calls/repository";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";
import {isUuid} from "@/lib/uuid";
import {formatLongDate} from "@/shared/format/calendar-date";
import {utcToZurich} from "@/features/rooms/timezone";

type AdminInquiryPageProps = {
  params: Promise<{locale: AppLocale; id: string}>;
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

export default async function AdminInquiryDetailPage({params}: AdminInquiryPageProps) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  await requireAdmin(
    locale,
    localizedPath(locale, {pathname: "/admin/calls/messages/[id]", params: {id}}),
  );
  if (!isUuid(id)) {
    notFound();
  }
  const inquiry = await getCourseInquiryById(id);
  if (!inquiry) {
    notFound();
  }

  const t = await getTranslations("Admin");
  const name = callPersonName(inquiry.firstName, inquiry.lastName);
  const received = utcToZurich(inquiry.createdAt);

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="calls"
          label={t("sectionsNav")}
          labels={adminSectionLabels(t)}
        />
        <BackLink href={adminCallListHref({tab: "messages"})} className="mt-6">
          {t("callsBack")}
        </BackLink>
        <h1 className="mt-6 font-serif text-heading">{name}</h1>
        <p className="mt-3 text-sm text-ink-muted">
          {formatLongDate(received.date, locale)} · {received.time}
        </p>

        <Panel className="mt-8 max-w-xl">
          <dl className="space-y-5 text-sm">
            <div>
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                {t("email")}
              </dt>
              <dd className="mt-1 text-ink">{inquiry.email}</dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                {t("callPhone")}
              </dt>
              <dd className="mt-1 text-ink">{inquiry.phone}</dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                {t("callCourse")}
              </dt>
              <dd className="mt-1 text-ink">
                {inquiry.courseTitle ?? t("callGeneral")}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                {t("callMessage")}
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-ink">{inquiry.message}</dd>
            </div>
          </dl>
        </Panel>
      </Section>
    </SiteShell>
  );
}
