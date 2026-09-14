import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {
  adminBookingListHref,
  adminBookingListHrefForPage,
  parseAdminBookingQuery,
} from "@/features/rooms/admin-booking-query";
import {AdminBookingDayAgenda} from "@/features/rooms/components/admin/bookings/day-agenda";
import {presentAdminBooking} from "@/features/rooms/components/admin/bookings/item";
import {AdminBookingsLayoutToggle} from "@/features/rooms/components/admin/bookings/layout-toggle";
import {AdminBookingListResults} from "@/features/rooms/components/admin/bookings/list-results";
import {AdminBookingsToolbar} from "@/features/rooms/components/admin/bookings/toolbar";
import {listAdminBookingMetrics, listAdminBookingsPage} from "@/features/rooms/repository";
import {todayInZurich} from "@/features/rooms/timezone";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {MetricStrip} from "@/shared/ui/metric-strip";
import {PageHeader} from "@/shared/ui/page-header";
import {Pagination} from "@/shared/ui/pagination";

type AdminBookingsPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    view?: string | string[];
    date?: string | string[];
    page?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminBookingsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});
  return buildPageMetadata({
    locale,
    title: t("adminBookingsTitle"),
    description: t("adminBookingsIntro"),
    hrefForLocale: () => "/admin/bookings",
    robots: {index: false, follow: false},
  });
}

export default async function AdminBookingsPage({params, searchParams}: AdminBookingsPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const query = parseAdminBookingQuery(await searchParams);
  await requireAdmin(locale, localizedPath(locale, adminBookingListHref(query)));
  const t = await getTranslations("Admin");
  const rooms = await getTranslations("Rooms");
  const today = todayInZurich();
  const isDay = query.view === "day";
  const [listing, metrics] = await Promise.all([
    listAdminBookingsPage({
      q: query.q,
      status: query.status,
      page: isDay ? 1 : query.page,
      pageSize: isDay ? 100 : undefined,
      day: isDay ? query.date : undefined,
      order: isDay ? "asc" : "desc",
    }),
    listAdminBookingMetrics(),
  ]);
  const items = listing.rows.map((row) =>
    presentAdminBooking(row, locale, today, {
      duration: (minutes) => rooms("bookDuration", {minutes}),
      status: (key) => rooms(key),
      billing: (key) => rooms(key),
    }),
  );
  const emptyMessage = isDay ? t("noAdminBookingsOnDay") : t("noAdminBookings");
  const openLabel = t("openBooking");

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="bookings"
          label={t("sectionsNav")}
          labels={adminSectionLabels(t)}
        />
        <PageHeader
          className="mt-6"
          title={t("adminBookingsTitle")}
          intro={t("adminBookingsIntro")}
          action={
            <Link href="/admin/bookings/new" className={buttonStyles()}>
              {t("createBooking")}
            </Link>
          }
        />

        <MetricStrip
          className="mt-8"
          density="trio"
          metrics={[
            {
              key: "today",
              label: t("metricToday"),
              value: metrics.today,
              href: adminBookingListHref({
                ...query,
                view: "day",
                date: today,
                page: 1,
              }),
            },
            {
              key: "confirmed",
              label: t("filterConfirmed"),
              value: metrics.confirmed,
              href: adminBookingListHref({
                ...query,
                status: "CONFIRMED",
                view: "list",
                page: 1,
              }),
            },
            {
              key: "cancelled",
              label: t("filterCancelled"),
              value: metrics.cancelled,
              href: adminBookingListHref({
                ...query,
                status: "all",
                view: "list",
                page: 1,
              }),
            },
          ]}
        />

        <div className="mt-6">
          <AdminBookingsToolbar
            locale={locale}
            query={query}
            today={today}
            trailing={
              isDay ? null : (
                <AdminBookingsLayoutToggle
                  label={t("layoutLabel")}
                  tableLabel={t("layoutTable")}
                  cardsLabel={t("layoutCards")}
                />
              )
            }
            labels={{
              view: t("bookingsView"),
              list: t("viewList"),
              day: t("viewDay"),
              today: t("jumpToday"),
              previousDay: t("previousDay"),
              nextDay: t("nextDay"),
              jumpToDate: t("jumpToDate"),
              includesToday: t("includesToday"),
              timezone: rooms("timezoneLabel"),
              filter: t("filter"),
              clearFilters: t("clearFilters"),
              search: t("searchBookings"),
              searchPlaceholder: t("searchBookingsPlaceholder"),
              showCancelled: t("showCancelled"),
            }}
          />

          <p className="mt-3 font-sans text-sm tabular-nums text-ink-muted">
            {t("bookingCount", {shown: listing.rows.length, total: listing.total})}
          </p>

          {listing.rows.length === 0 ? (
            <p className="mt-6 text-sm leading-7 text-ink-muted">{emptyMessage}</p>
          ) : isDay ? (
            <div className="mt-4">
              <AdminBookingDayAgenda items={items} openLabel={openLabel} />
            </div>
          ) : (
            <div className="mt-4">
              <AdminBookingListResults
                items={items}
                openLabel={openLabel}
                tableLabels={{
                  when: t("bookingWhen"),
                  therapist: t("bookingOwner"),
                  room: t("bookingRoom"),
                  duration: t("bookingDuration"),
                  status: t("status"),
                  billing: t("bookingBilling"),
                  amount: t("bookingAmount"),
                  open: openLabel,
                  today: t("jumpToday"),
                }}
              />
            </div>
          )}

          {!isDay && listing.pageCount > 1 ? (
            <Pagination
              className="mt-6"
              previous={
                listing.page > 1
                  ? adminBookingListHrefForPage(query, listing.page - 1)
                  : null
              }
              next={
                listing.page < listing.pageCount
                  ? adminBookingListHrefForPage(query, listing.page + 1)
                  : null
              }
              status={t("pageStatus", {page: listing.page, pageCount: listing.pageCount})}
              labels={{previous: t("previous"), next: t("next")}}
            />
          ) : null}
        </div>
      </Section>
    </SiteShell>
  );
}
