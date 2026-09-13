import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {blockLocalLabel} from "@/features/rooms/blocks";
import {RoomBlockForm} from "@/features/rooms/components/admin/block-form";
import {EditRoomForm} from "@/features/rooms/components/admin/edit-room-form";
import {findRoomById, listBlocksForRoom} from "@/features/rooms/repository";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import type {AppLocale} from "@/i18n/routing";
import {BackLink} from "@/shared/ui/back-link";
import {Eyebrow, Section} from "@/shared/ui/layout";

type AdminRoomDetailPageProps = {
  params: Promise<{locale: AppLocale; id: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminRoomDetailPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Rooms"});

  return buildPageMetadata({
    locale,
    title: t("editTitle"),
    description: t("adminRoomsIntro"),
    hrefForLocale: () => "/admin/rooms",
    robots: {index: false, follow: false},
  });
}

export default async function AdminRoomDetailPage({params}: AdminRoomDetailPageProps) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  await requireAdmin(locale, localizedPath(locale, {
    pathname: "/admin/rooms/[id]",
    params: {id},
  }));
  const t = await getTranslations("Rooms");
  const admin = await getTranslations("Admin");
  const room = await findRoomById(id);

  if (!room) {
    notFound();
  }

  const blocks = await listBlocksForRoom(room.id);

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{admin("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="rooms"
          label={admin("sectionsNav")}
          labels={adminSectionLabels(admin)}
        />
        <BackLink href="/admin/rooms" className="mt-6">
          {t("backToRooms")}
        </BackLink>
        <h1 className="mt-5 font-serif text-heading">{t("editTitle")}</h1>
        <p className="mt-3 font-sans text-lg font-medium">{room.name}</p>
        <div className="mt-10">
          <EditRoomForm locale={locale} room={room} />
        </div>
        <div className="mt-16">
          <RoomBlockForm
            locale={locale}
            roomId={room.id}
            blocks={blocks.map((block) => ({
              id: block.id,
              label: blockLocalLabel(block.startsAt, block.endsAt),
              reason: block.reason,
            }))}
          />
        </div>
      </Section>
    </SiteShell>
  );
}
