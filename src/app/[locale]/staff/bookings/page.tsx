import {getTranslations, setRequestLocale} from "next-intl/server";

import {AdminWorkspace} from "@/features/admin/components/admin-workspace";
import {listBookings} from "@/features/bookings/repository";
import {requireAdmin} from "@/features/auth/require";
import {StaffBookingsTable} from "@/features/staff/bookings-table";
import {StaffWaitlistTable} from "@/features/staff/waitlist-table";
import {listWaitlistEntries} from "@/features/waitlist/repository";
import {loadCatalogueCourses} from "@/features/courses/live";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {buttonStyles} from "@/shared/ui/button";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type StaffPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: StaffPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Staff"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("intro"),
    hrefForLocale: () => "/staff/bookings",
    robots: {index: false, follow: false},
  });
}

export default async function StaffBookingsPage({params}: StaffPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  await requireAdmin(locale, localizedPath(locale, "/staff/bookings"));
  const t = await getTranslations("Staff");
  const bookings = await listBookings();
  const waitlist = await listWaitlistEntries();
  const catalogue = await loadCatalogueCourses();

  return (
    <AdminWorkspace locale={locale} current="users">
      <WorkspacePage
        title={t("title")}
        intro={t("intro")}
        action={
          <a
            href="/api/staff/bookings.csv"
            className={buttonStyles({variant: "secondary"})}
          >
            {t("csv")}
          </a>
        }
      >
        <p className="mt-2 text-sm">
          <Link href="/admin/users" className="underline-offset-4 hover:underline">
            {t("usersLink")}
          </Link>
        </p>
        <div className="mt-8">
          <StaffBookingsTable
            bookings={bookings}
            labels={{
              name: t("name"),
              email: t("email"),
              course: t("course"),
              date: t("date"),
              amount: t("amount"),
              status: t("status"),
              created: t("created"),
              paid: t("paid"),
              empty: t("empty"),
            }}
          />
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-ink pt-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-subheading">{t("waitlistTitle")}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
              {t("waitlistIntro")}
            </p>
          </div>
          <a
            href="/api/staff/waitlist.csv"
            className={buttonStyles({variant: "secondary"})}
          >
            {t("waitlistCsv")}
          </a>
        </div>
        <div className="mt-8">
          <StaffWaitlistTable
            entries={waitlist}
            courses={catalogue}
            locale={locale}
            labels={{
              name: t("name"),
              email: t("email"),
              phone: t("phone"),
              course: t("course"),
              session: t("waitlistSession"),
              pendingDates: t("waitlistPendingDates"),
              notified: t("waitlistNotified"),
              notifyPending: t("waitlistNotifyPending"),
              created: t("created"),
              empty: t("waitlistEmpty"),
            }}
          />
        </div>
      </WorkspacePage>
    </AdminWorkspace>
  );
}
