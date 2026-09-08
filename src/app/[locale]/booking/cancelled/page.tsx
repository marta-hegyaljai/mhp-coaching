import {getTranslations, setRequestLocale} from "next-intl/server";

import {getBookingById} from "@/features/bookings/repository";
import {getCourseById} from "@/features/courses/queries";
import {buildPageMetadata} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Section} from "@/shared/ui/layout";

type CancelledPageProps = {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<{bookingId?: string}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: CancelledPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "BookingCancelled"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("intro"),
    hrefForLocale: () => "/booking/cancelled",
    robots: {index: false, follow: false},
  });
}

export default async function BookingCancelledPage({
  params,
  searchParams,
}: CancelledPageProps) {
  const {locale} = await params;
  const {bookingId} = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("BookingCancelled");
  const booking = bookingId ? await getBookingById(bookingId) : undefined;
  const course = booking ? getCourseById(booking.courseId) : undefined;

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="md">
        <div className="max-w-3xl">
          <h1 className="font-serif text-title">{t("title")}</h1>
          <p className="mt-5 text-lead text-ink-muted">{t("intro")}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={
                course
                  ? {
                      pathname: "/courses/[slug]",
                      params: {slug: course.slug[locale]},
                    }
                  : "/courses"
              }
              className={`${buttonStyles({size: "lg"})} w-full sm:w-auto`}
            >
              {t("retry")}
              <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
            </Link>
            <Link
              href="/"
              className={`${buttonStyles({variant: "secondary", size: "lg"})} w-full sm:w-auto`}
            >
              {t("home")}
            </Link>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
