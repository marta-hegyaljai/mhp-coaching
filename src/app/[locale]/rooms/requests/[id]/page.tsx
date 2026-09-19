import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {requireRoomBooking} from "@/features/auth/require";
import {getMyAvailabilityRequest} from "@/features/rooms/availability-requests";
import {BookingFacts} from "@/features/rooms/components/booking/booking-facts";
import {RoomsWorkspace} from "@/features/rooms/components/rooms-workspace";
import {WithdrawRequestForm} from "@/features/rooms/components/withdraw-request-form";
import {RoomError} from "@/features/rooms/errors";
import {bookingStamp, bookingWhen} from "@/features/rooms/format";
import {assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {Panel, PanelDivider} from "@/shared/ui/panel";
import {SectionLabel} from "@/shared/ui/section-label";
import {StatusLabel} from "@/shared/ui/status-label";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type RequestDetailPageProps = {
  params: Promise<{locale: AppLocale; id: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: RequestDetailPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});
  return buildPageMetadata({
    locale,
    title: t("requestDetailTitle"),
    description: t("requestsIntro"),
    hrefForLocale: () => "/rooms/requests",
    robots: {index: false, follow: false},
  });
}

export default async function RoomRequestDetailPage({params}: RequestDetailPageProps) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const user = await requireRoomBooking(
    locale,
    localizedPath(locale, {pathname: "/rooms/requests/[id]", params: {id}}),
  );
  const t = await getTranslations("Rooms");

  let request;
  try {
    request = await getMyAvailabilityRequest(user, id);
  } catch (error) {
    if (error instanceof RoomError && error.code === "notFound") {
      notFound();
    }
    throw error;
  }
  assertNoPrivateNoteMaterial(request, "", ["adminNote", "admin_note"]);

  const when = bookingWhen(new Date(request.startsAt), new Date(request.endsAt), locale);
  const durationMinutes = Math.round(
    (new Date(request.endsAt).getTime() - new Date(request.startsAt).getTime()) / 60_000,
  );
  const statusKey =
    request.status === "RESOLVED"
      ? "requestStatusResolved"
      : request.status === "DECLINED"
        ? "requestStatusDeclined"
        : "requestStatusOpen";

  return (
    <RoomsWorkspace
      locale={locale}
      current="requests"
      hreflangs={{
        fr: {pathname: "/rooms/requests/[id]", params: {id}},
        de: {pathname: "/rooms/requests/[id]", params: {id}},
        en: {pathname: "/rooms/requests/[id]", params: {id}},
      }}
    >
      <WorkspacePage
        back={<BackLink href="/rooms/requests">{t("backToRequests")}</BackLink>}
        title={t("requestDetailTitle")}
      >

        <div className="mt-8 max-w-xl space-y-6">
          <Panel as="article">
            <StatusLabel tone={request.status === "OPEN" ? "strong" : "muted"}>
              {t(statusKey)}
            </StatusLabel>
            <div className="mt-3">
              <BookingFacts
                roomName={request.preferredRoomName ?? t("anyRoom")}
                when={when}
                durationLabel={t("bookDuration", {minutes: durationMinutes})}
              />
            </div>
            <p className="mt-6 text-sm leading-7 text-ink-muted">{t("requestDoesNotReserve")}</p>
            {request.resolvedAt ? (
              <p className="mt-3 text-sm leading-7 text-ink-muted">
                {t("requestResolvedAt", {
                  when: bookingStamp(new Date(request.resolvedAt), locale),
                })}
              </p>
            ) : null}
            {request.message ? (
              <>
                <PanelDivider className="mt-6" />
                <SectionLabel className="mt-6">{t("requestMessage")}</SectionLabel>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink">
                  {request.message}
                </p>
              </>
            ) : null}
          </Panel>

          {request.status === "OPEN" ? (
            <WithdrawRequestForm locale={locale} requestId={request.id} />
          ) : null}
        </div>
      </WorkspacePage>
    </RoomsWorkspace>
  );
}
