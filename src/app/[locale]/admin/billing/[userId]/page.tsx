import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {findUserById} from "@/features/auth/repository";
import {requireAdmin} from "@/features/auth/require";
import {
  UsageLineList,
  UsageMonthBanner,
  UsageRoomGrid,
  UsageTotals,
} from "@/features/rooms/components/usage-panels";
import {loadOpenMonthUsage} from "@/features/rooms/usage";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {DownloadIcon} from "@/shared/ui/icons";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";

type AdminBillingUserPageProps = {
  params: Promise<{locale: AppLocale; userId: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminBillingUserPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  return buildPageMetadata({
    locale,
    title: t("billingUserTitle"),
    description: t("billingIntro"),
    hrefForLocale: () => "/admin/billing",
    robots: {index: false, follow: false},
  });
}

export default async function AdminBillingUserPage({params}: AdminBillingUserPageProps) {
  const {locale, userId} = await params;
  setRequestLocale(locale);
  const actor = await requireAdmin(locale, localizedPath(locale, {
    pathname: "/admin/billing/[userId]",
    params: {userId},
  }));
  const t = await getTranslations("Admin");
  const rooms = await getTranslations("Rooms");
  const user = await findUserById(userId);
  if (!user) {
    notFound();
  }

  const report = await loadOpenMonthUsage({actor, userId});
  const usage = report.users[0];

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="billing"
          label={t("sectionsNav")}
          labels={adminSectionLabels(t)}
        />
        <p className="mt-4 text-sm">
          <Link href="/admin/billing" className="underline-offset-4 hover:underline">
            {t("backToBilling")}
          </Link>
        </p>
        <h1 className="mt-3 font-serif text-heading">{t("billingUserTitle")}</h1>
        <p className="mt-4 font-sans text-lg font-medium break-all">{user.email}</p>
        <p className="mt-2 text-sm leading-7 text-ink-muted">
          {user.firstName} {user.lastName}
          {user.roomDiscountPercent > 0
            ? ` · ${rooms("bookDiscount", {percent: user.roomDiscountPercent})}`
            : ""}
        </p>
        <p className="mt-3">
          <Link
            href={{pathname: "/admin/users/[id]", params: {id: user.id}}}
            className="text-sm underline-offset-4 hover:underline"
          >
            {t("manageUser")}
          </Link>
        </p>
        <UsageMonthBanner locale={locale} year={report.year} month={report.month} />
        {usage ? (
          <>
            <UsageTotals
              locale={locale}
              billedMinutes={usage.billedMinutes}
              billedAmountMinor={usage.billedAmountMinor}
              bookingCount={usage.bookingCount}
            />
            <UsageRoomGrid locale={locale} rooms={usage.rooms} />
            <UsageLineList
              locale={locale}
              lines={usage.lines}
              empty={t("billingUserEmpty")}
              hrefForLine={(line) => ({
                pathname: "/admin/bookings/[id]",
                params: {id: line.bookingId},
              })}
            />
          </>
        ) : (
          <Panel className="mt-10 max-w-xl">
            <p className="text-sm leading-7 text-ink-muted">{t("billingUserEmpty")}</p>
          </Panel>
        )}
        {usage ? (
          <p className="mt-10">
            <a
              href={`/api/admin/billing.csv?user=${encodeURIComponent(user.id)}`}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
            >
              <DownloadIcon />
              {t("billingUserCsv")}
            </a>
          </p>
        ) : null}
      </Section>
    </SiteShell>
  );
}
