import {getTranslations, setRequestLocale} from "next-intl/server";

import {AuthNotice} from "@/features/auth/components/auth-field";
import {requireRoomBooking} from "@/features/auth/require";
import {listMyAvailabilityRequests} from "@/features/rooms/availability-requests";
import {RequestCard} from "@/features/rooms/components/request-card";
import {RoomsWorkspace} from "@/features/rooms/components/rooms-workspace";
import {assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {Panel} from "@/shared/ui/panel";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type RequestsPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{submitted?: string | string[]; withdrawn?: string | string[]}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: RequestsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});
  return buildPageMetadata({
    locale,
    title: t("requestsTitle"),
    description: t("requestsIntro"),
    hrefForLocale: () => "/rooms/requests",
    robots: {index: false, follow: false},
  });
}

export default async function RoomRequestsPage({params, searchParams}: RequestsPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const user = await requireRoomBooking(locale, localizedPath(locale, "/rooms/requests"));
  const t = await getTranslations("Rooms");
  const requests = await listMyAvailabilityRequests(user);
  assertNoPrivateNoteMaterial(requests, "", ["adminNote", "admin_note"]);
  const query = await searchParams;
  const notice =
    firstString(query.submitted) === "1"
      ? t("submitted")
      : firstString(query.withdrawn) === "1"
        ? t("withdrawn")
        : null;
  const open = requests.filter((request) => request.status === "OPEN");
  const closed = requests.filter((request) => request.status !== "OPEN");

  return (
    <RoomsWorkspace locale={locale} current="requests">
      <WorkspacePage
        title={t("requestsTitle")}
        intro={t("requestsIntro")}
        action={
          <Link href="/rooms/requests/new" className={buttonStyles()}>
            {t("newRequest")}
          </Link>
        }
      >

        {notice ? (
          <div className="mt-8 max-w-xl">
            <AuthNotice>{notice}</AuthNotice>
          </div>
        ) : null}

        {requests.length === 0 ? (
          <Panel className="mt-10 max-w-xl">
            <p className="text-sm leading-7 text-ink-muted">{t("requestsEmpty")}</p>
          </Panel>
        ) : (
          <div className="mt-10 space-y-12">
            <RequestGroup
              title={t("openRequestsTitle")}
              empty={t("openRequestsEmpty")}
              requests={open}
              locale={locale}
              roomFallback={t("anyRoom")}
              statusLabel={(status) => t(requestStatusKey(status))}
            />
            <RequestGroup
              title={t("resolvedRequestsTitle")}
              empty={t("resolvedRequestsEmpty")}
              requests={closed}
              locale={locale}
              roomFallback={t("anyRoom")}
              statusLabel={(status) => t(requestStatusKey(status))}
            />
          </div>
        )}
      </WorkspacePage>
    </RoomsWorkspace>
  );
}

function RequestGroup({
  title,
  empty,
  requests,
  locale,
  roomFallback,
  statusLabel,
}: {
  title: string;
  empty: string;
  requests: Awaited<ReturnType<typeof listMyAvailabilityRequests>>;
  locale: AppLocale;
  roomFallback: string;
  statusLabel: (status: "OPEN" | "RESOLVED" | "DECLINED") => string;
}) {
  return (
    <section>
      <h2 className="font-serif text-2xl leading-tight">{title}</h2>
      {requests.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {requests.map((request) => (
            <li key={request.id}>
              <RequestCard
                request={request}
                locale={locale}
                href={{pathname: "/rooms/requests/[id]", params: {id: request.id}}}
                statusLabel={statusLabel(request.status)}
                roomLabel={request.preferredRoomName ?? roomFallback}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function requestStatusKey(status: "OPEN" | "RESOLVED" | "DECLINED") {
  if (status === "RESOLVED") {
    return "requestStatusResolved" as const;
  }
  if (status === "DECLINED") {
    return "requestStatusDeclined" as const;
  }
  return "requestStatusOpen" as const;
}

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
