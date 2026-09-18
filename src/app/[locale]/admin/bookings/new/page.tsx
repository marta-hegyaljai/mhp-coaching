import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {parseBookQuery} from "@/features/rooms/book-query";
import {AdminCreateBookingForm} from "@/features/rooms/components/admin/bookings/create-form";
import {SlotNavigator} from "@/features/rooms/components/booking/slot-navigator";
import {listRooms} from "@/features/rooms/inventory";
import {listRoomCapableUsers} from "@/features/rooms/repository";
import {previewBookableSlot} from "@/features/rooms/reservations";
import {todayInZurich} from "@/features/rooms/timezone";
import {RoomError} from "@/features/rooms/errors";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {isUuid} from "@/lib/uuid";
import {BackLink} from "@/shared/ui/back-link";
import {SelectField} from "@/shared/ui/field";
import {Panel} from "@/shared/ui/panel";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type NewBookingPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    user?: string | string[];
    room?: string | string[];
    date?: string | string[];
    start?: string | string[];
    end?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: NewBookingPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  return buildPageMetadata({
    locale,
    title: t("createBookingTitle"),
    description: t("createBookingIntro"),
    hrefForLocale: () => "/admin/bookings/new",
    robots: {index: false, follow: false},
  });
}

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminNewBookingPage({params, searchParams}: NewBookingPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  await requireAdmin(locale, localizedPath(locale, "/admin/bookings/new"));
  const t = await getTranslations("Admin");
  const roomsCopy = await getTranslations("Rooms");
  const errors = await getTranslations("Rooms.errors");
  const users = await listRoomCapableUsers();
  const rooms = (await listRooms()).filter((room) => room.active);
  const raw = await searchParams;
  const query = parseBookQuery(raw);
  const userParam = firstString(raw.user);
  const selectedUserId =
    userParam && isUuid(userParam) && users.some((user) => user.id === userParam)
      ? userParam
      : users[0]?.id;
  const roomId = query.roomId ?? rooms[0]?.id;
  const date = query.date ?? todayInZurich();
  const ready = users.length > 0 && rooms.length > 0;

  let preview = null;
  let previewError: string | null = null;
  if (ready && roomId) {
    try {
      preview = await previewBookableSlot({
        roomId,
        date,
        start: query.start,
        end: query.end,
        allowPast: true,
      });
    } catch (error) {
      previewError = error instanceof RoomError ? errors(error.code) : errors("saveFailed");
    }
  }

  return (
    <SiteShell locale={locale} footerCta={null}>
      <WorkspacePage
        eyebrow={t("eyebrow")}
        nav={
          <AdminSubnav
            current="bookings"
            label={t("sectionsNav")}
            labels={adminSectionLabels(t)}
          />
        }
        back={<BackLink href="/admin/bookings">{t("backToAdminBookings")}</BackLink>}
        title={t("createBookingTitle")}
        intro={t("createBookingIntro")}
      >

        <div className="mt-8 max-w-xl space-y-6">
          {ready ? (
            <>
              <SlotNavigator
                action={localizedPath(locale, "/admin/bookings/new")}
                label={roomsCopy("newSlot")}
                rooms={rooms}
                roomId={roomId}
                date={date}
              >
                <SelectField
                  id="slot-user"
                  name="user"
                  label={t("bookingUser")}
                  defaultValue={selectedUserId}
                  fieldClassName="sm:col-span-2"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} · {user.email}
                    </option>
                  ))}
                </SelectField>
              </SlotNavigator>

              {preview && selectedUserId ? (
                <AdminCreateBookingForm
                  locale={locale}
                  userId={selectedUserId}
                  preview={preview}
                />
              ) : (
                <Panel>
                  <p className="text-sm leading-7 text-ink-muted">
                    {previewError ?? errors("slotUnavailable")}
                  </p>
                </Panel>
              )}
            </>
          ) : (
            <Panel>
              <p className="text-sm leading-7 text-ink-muted">
                {users.length === 0 ? t("emptyRoomUsers") : roomsCopy("emptyRooms")}
              </p>
            </Panel>
          )}
        </div>
      </WorkspacePage>
    </SiteShell>
  );
}
