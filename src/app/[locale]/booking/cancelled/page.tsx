import {getTranslations, setRequestLocale} from "next-intl/server";

import {isDateToBeConfirmed} from "@/features/bookings/booking-date";
import {getBookingById} from "@/features/bookings/repository";
import {formatDateRange} from "@/features/courses/dates";
import {getCourseById} from "@/features/courses/queries";
import {ContactForm} from "@/features/inquiries/components/contact-form";
import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Section} from "@/shared/ui/layout";

type CancelledPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{bookingId?: string; source?: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params, searchParams}: CancelledPageProps) {
  const {locale} = await params;
  const {source} = await searchParams;
  const t = await getTranslations({locale, namespace: "BookingCancelled"});
  const otherPayment = source === "other";

  return buildPageMetadata({
    locale,
    title: otherPayment ? t("otherPaymentTitle") : t("title"),
    description: otherPayment ? t("otherPaymentIntro") : t("intro"),
    hrefForLocale: () => "/booking/cancelled",
    robots: {index: false, follow: false},
  });
}

export default async function BookingCancelledPage({
  params,
  searchParams,
}: CancelledPageProps) {
  const {locale} = await params;
  const {bookingId, source} = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("BookingCancelled");
  const booking = bookingId ? await getBookingById(bookingId) : undefined;
  const course = booking ? getCourseById(booking.courseId) : undefined;
  const otherPayment = source === "other";
  const dateLabel = booking
    ? isDateToBeConfirmed(booking.courseDateStart)
      ? t("dateToBeConfirmed")
      : formatDateRange(booking.courseDateStart, booking.courseDateEnd, locale)
    : undefined;

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="md">
        <div className="max-w-3xl">
          <h1 className="font-serif text-title">
            {otherPayment ? t("otherPaymentTitle") : t("title")}
          </h1>
          <p className="mt-5 text-lead text-ink-muted">
            {otherPayment ? t("otherPaymentIntro") : t("intro")}
          </p>
          {booking ? (
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between gap-4 sm:justify-start sm:gap-8">
                <dt className="text-ink-subtle">{t("course")}</dt>
                <dd className="font-medium">{booking.courseTitle}</dd>
              </div>
              <div className="flex justify-between gap-4 sm:justify-start sm:gap-8">
                <dt className="text-ink-subtle">{t("dates")}</dt>
                <dd className="font-medium">{dateLabel}</dd>
              </div>
            </dl>
          ) : null}
          {otherPayment ? null : (
            <NavLinks
              retryLabel={t("retry")}
              homeLabel={t("home")}
              courseSlug={course?.slug[locale]}
            />
          )}
        </div>

        <div className={`max-w-2xl ${otherPayment ? "mt-10" : "mt-14 border-t border-line pt-10"}`}>
          {otherPayment ? null : (
            <>
              <h2 className="font-serif text-heading">{t("otherPaymentTitle")}</h2>
              <p className="mt-4 text-base leading-7 text-ink-muted">
                {t("otherPaymentIntro")}
              </p>
            </>
          )}
          <div className={otherPayment ? "" : "mt-6"}>
            <ContactForm
              locale={locale}
              kind="payment"
              bookingId={booking?.id}
              courseId={booking?.courseId}
              courseTitle={booking?.courseTitle}
              courseDates={dateLabel}
              defaultName={
                booking ? `${booking.firstName} ${booking.lastName}` : undefined
              }
              defaultEmail={booking?.email}
              defaultPhone={booking?.phone}
            />
          </div>
        </div>
        {otherPayment ? (
          <NavLinks
            retryLabel={t("retry")}
            homeLabel={t("home")}
            courseSlug={course?.slug[locale]}
          />
        ) : null}
      </Section>
    </SiteShell>
  );
}

function NavLinks({
  retryLabel,
  homeLabel,
  courseSlug,
}: {
  retryLabel: string;
  homeLabel: string;
  courseSlug?: string;
}) {
  return (
    <div className="mt-10 flex max-w-3xl flex-col gap-3 sm:flex-row">
      <Link
        href={
          courseSlug
            ? {
                pathname: "/courses/[slug]",
                params: {slug: courseSlug},
              }
            : "/courses"
        }
        className={`${buttonStyles({size: "lg"})} w-full sm:w-auto`}
      >
        {retryLabel}
        <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
      </Link>
      <Link
        href="/"
        className={`${buttonStyles({variant: "secondary", size: "lg"})} w-full sm:w-auto`}
      >
        {homeLabel}
      </Link>
    </div>
  );
}
