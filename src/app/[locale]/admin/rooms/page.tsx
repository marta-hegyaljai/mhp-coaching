import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminWorkspace} from "@/features/admin/components/admin-workspace";
import {requireAdmin} from "@/features/auth/require";
import {CreateRoomForm} from "@/features/rooms/components/admin/create-room-form";
import {RoomOrderControls} from "@/features/rooms/components/admin/room-order-controls";
import {listRooms} from "@/features/rooms/inventory";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {Price} from "@/shared/ui/price";
import {StatusLabel, statusRailClass} from "@/shared/ui/status-label";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type AdminRoomsPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminRoomsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});

  return buildPageMetadata({
    locale,
    title: t("adminRoomsTitle"),
    description: t("adminRoomsIntro"),
    hrefForLocale: () => "/admin/rooms",
    robots: {index: false, follow: false},
  });
}

export default async function AdminRoomsPage({params}: AdminRoomsPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  await requireAdmin(locale, localizedPath(locale, "/admin/rooms"));
  const t = await getTranslations("Rooms");
  const rooms = await listRooms();

  return (
    <AdminWorkspace locale={locale} current="rooms">
      <WorkspacePage
        title={t("adminRoomsTitle")}
        intro={t("adminRoomsIntro")}
      >
        <div className="mt-6">
          {rooms.length === 0 ? (
            <div className="rounded-panel border border-ink bg-white px-5 py-8">
              <p className="text-sm text-ink-muted">{t("emptyRooms")}</p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {rooms.map((room, index) => (
                <li
                  key={room.id}
                  className={`flex h-full flex-col rounded-panel border border-ink bg-white p-5 ${statusRailClass(room.active ? "ok" : "stop")}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <StatusLabel tone={room.active ? "ok" : "stop"}>
                      {room.active ? t("active") : t("inactive")}
                    </StatusLabel>
                    <span className="font-sans text-xs font-semibold tabular-nums text-ink-subtle">
                      {index + 1}
                    </span>
                  </div>
                  <h2 className="mt-3 font-serif text-subheading leading-tight">{room.name}</h2>
                  {room.description ? (
                    <p className="mt-2 text-sm leading-6 text-ink-muted">{room.description}</p>
                  ) : null}
                  <Price size="sm" className="mt-4">
                    {formatChf(minorUnitsToFrancs(room.hourlyRateMinor), locale)}
                    {t("perHour")}
                  </Price>
                  <div className="grow" />
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                    <Link
                      href={{pathname: "/admin/rooms/[id]", params: {id: room.id}}}
                      className={buttonStyles()}
                    >
                      {t("manage")}
                    </Link>
                    <RoomOrderControls
                      locale={locale}
                      roomId={room.id}
                      isFirst={index === 0}
                      isLast={index === rooms.length - 1}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-16">
          <h2 className="font-serif text-subheading">{t("createRoom")}</h2>
          <div className="mt-6">
            <CreateRoomForm locale={locale} />
          </div>
        </div>
      </WorkspacePage>
    </AdminWorkspace>
  );
}
