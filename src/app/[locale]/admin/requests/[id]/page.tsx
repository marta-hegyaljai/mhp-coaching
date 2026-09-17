import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {AuthNotice} from "@/features/auth/components/auth-field";
import {requireAdmin} from "@/features/auth/require";
import {getAdminAvailabilityRequest} from "@/features/rooms/availability-requests";
import {AdminRequestResolveForm} from "@/features/rooms/components/admin/request-resolve-form";
import {BookingFacts} from "@/features/rooms/components/booking/booking-facts";
import {RoomError} from "@/features/rooms/errors";
import {bookingWhen} from "@/features/rooms/format";
import {assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel, PanelDivider} from "@/shared/ui/panel";
import {SectionLabel} from "@/shared/ui/section-label";
import {StatusLabel} from "@/shared/ui/status-label";

type AdminRequestDetailProps = {
  params: Promise<{locale: AppLocale; id: string}>;
  searchParams: Promise<{resolved?: string | string[]; declined?: string | string[]}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminRequestDetailProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  return buildPageMetadata({
    locale,
    title: t("adminRequestsTitle"),
    description: t("adminRequestsIntro"),
    hrefForLocale: () => "/admin/requests",
    robots: {index: false, follow: false},
  });
}

export default async function AdminRequestDetailPage({
  params,
  searchParams,
}: AdminRequestDetailProps) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const actor = await requireAdmin(
    locale,
    localizedPath(locale, {pathname: "/admin/requests/[id]", params: {id}}),
  );
  const t = await getTranslations("Admin");
  const rooms = await getTranslations("Rooms");
  const notices = await searchParams;

  let request;
  try {
    request = await getAdminAvailabilityRequest(actor, id);
  } catch (error) {
    if (error instanceof RoomError && error.code === "notFound") {
      notFound();
    }
    throw error;
  }
  assertNoPrivateNoteMaterial(request);

  const when = bookingWhen(new Date(request.startsAt), new Date(request.endsAt), locale);
  const durationMinutes = Math.round(
    (new Date(request.endsAt).getTime() - new Date(request.startsAt).getTime()) / 60_000,
  );
  const statusLabel =
    request.status === "RESOLVED"
      ? t("filterResolved")
      : request.status === "DECLINED"
        ? t("filterDeclined")
        : t("filterOpen");
  const notice =
    firstString(notices.resolved) === "1"
      ? t("resolved")
      : firstString(notices.declined) === "1"
        ? t("declined")
        : null;

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="requests"
          label={t("sectionsNav")}
          labels={adminSectionLabels(t)}
        />
        <BackLink href="/admin/requests" className="mt-6">
          {t("backToAdminRequests")}
        </BackLink>
        <h1 className="mt-5 font-serif text-heading">{t("adminRequestsTitle")}</h1>

        {notice ? (
          <div className="mt-8 max-w-xl">
            <AuthNotice>{notice}</AuthNotice>
          </div>
        ) : null}

        <div className="mt-8 max-w-xl space-y-6">
          <Panel as="article">
            <StatusLabel tone={request.status === "OPEN" ? "gold" : request.status === "DECLINED" ? "stop" : "ok"}>
              {statusLabel}
            </StatusLabel>
            <div className="mt-3">
              <BookingFacts
                roomName={request.preferredRoomName ?? rooms("anyRoom")}
                when={when}
                durationLabel={rooms("bookDuration", {minutes: durationMinutes})}
                ownerLabel={`${request.owner.firstName} ${request.owner.lastName} · ${request.owner.email}`}
              />
            </div>
            <p className="mt-6 text-sm leading-7 text-ink-muted">{rooms("requestDoesNotReserve")}</p>
            {request.message ? (
              <>
                <PanelDivider className="mt-6" />
                <SectionLabel className="mt-6">{rooms("requestMessage")}</SectionLabel>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink">
                  {request.message}
                </p>
              </>
            ) : null}
            {request.adminNote ? (
              <>
                <PanelDivider className="mt-6" />
                <SectionLabel className="mt-6">{t("adminRequestNote")}</SectionLabel>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink">
                  {request.adminNote}
                </p>
              </>
            ) : null}
          </Panel>

          {request.status === "OPEN" ? (
            <AdminRequestResolveForm locale={locale} requestId={request.id} />
          ) : null}
        </div>
      </Section>
    </SiteShell>
  );
}

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
