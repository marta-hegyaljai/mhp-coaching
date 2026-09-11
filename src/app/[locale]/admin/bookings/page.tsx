import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {requireAdmin} from "@/features/auth/require";
import {
  ADMIN_BOOKING_STATUSES,
  adminBookingListHref,
  adminBookingListHrefForPage,
  parseAdminBookingQuery,
  type AdminBookingStatusFilter,
} from "@/features/rooms/admin-booking-query";
import {AdminBookingCard} from "@/features/rooms/components/admin/booking-card";
import {listAdminBookingsPage} from "@/features/rooms/repository";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles, Button} from "@/shared/ui/button";
import {InputField, SelectField} from "@/shared/ui/field";
import {FilterBar} from "@/shared/ui/filter-bar";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Pagination} from "@/shared/ui/pagination";

type AdminBookingsPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{q?: string | string[]; status?: string | string[]; page?: string | string[]}>;
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
  const listing = await listAdminBookingsPage(query);
  const statusLabels: Record<AdminBookingStatusFilter, string> = {
    all: t("filterAll"),
    CONFIRMED: t("filterConfirmed"),
    CANCELLED: t("filterCancelled"),
  };

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="bookings"
          label={t("sectionsNav")}
          labels={adminSectionLabels(t)}
        />
        <h1 className="mt-6 font-serif text-heading">{t("adminBookingsTitle")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{t("adminBookingsIntro")}</p>
        <p className="mt-6">
          <Link href="/admin/bookings/new" className={buttonStyles()}>
            {t("createBooking")}
          </Link>
        </p>

        <div className="mt-10">
          <FilterBar
            action={localizedPath(locale, "/admin/bookings")}
            label={t("filter")}
            columnsClassName="sm:grid-cols-[minmax(0,1fr)_11rem_auto]"
            actions={
              <>
                <Button type="submit" variant="secondary">
                  {t("filter")}
                </Button>
                <Link
                  href="/admin/bookings"
                  className="text-sm underline-offset-4 hover:underline"
                >
                  {t("clearFilters")}
                </Link>
              </>
            }
          >
            <InputField
              id="booking-search"
              name="q"
              type="search"
              size="sm"
              label={t("searchBookings")}
              defaultValue={query.q}
              autoComplete="off"
            />
            <SelectField
              id="booking-status"
              name="status"
              size="sm"
              label={t("status")}
              defaultValue={query.status}
            >
              {ADMIN_BOOKING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </SelectField>
          </FilterBar>

          <p className="mt-4 font-sans text-sm tabular-nums text-ink-muted">
            {t("bookingCount", {shown: listing.rows.length, total: listing.total})}
          </p>

          {listing.rows.length === 0 ? (
            <p className="mt-6 text-sm leading-7 text-ink-muted">{t("noAdminBookings")}</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listing.rows.map(({booking, owner}) => (
                <li key={booking.id}>
                  <AdminBookingCard booking={booking} owner={owner} locale={locale} />
                </li>
              ))}
            </ul>
          )}

          {listing.pageCount > 1 ? (
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
