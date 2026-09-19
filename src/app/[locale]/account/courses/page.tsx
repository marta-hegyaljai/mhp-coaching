import {getTranslations, setRequestLocale} from "next-intl/server";

import {MyCourseCard} from "@/features/account/components/my-course-card";
import {listMyCourses} from "@/features/account/my-courses";
import {registrationStatusMessageKey} from "@/features/account/status-label";
import {AccountWorkspace} from "@/features/auth/components/account-workspace";
import {requireSignedInUser} from "@/features/auth/require";
import {CertificateLibrary} from "@/features/certificates/components/certificate-library";
import {listOwnCertificates} from "@/features/certificates/service";
import {toCertificateCardView} from "@/features/certificates/views";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {WorkspacePage} from "@/shared/ui/workspace-page";

type MyCoursesPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: MyCoursesPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Auth"});

  return buildPageMetadata({
    locale,
    title: t("myCoursesTitle"),
    description: t("myCoursesIntro"),
    hrefForLocale: () => "/account/courses",
    robots: {index: false, follow: false},
  });
}

export default async function MyCoursesPage({params}: MyCoursesPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const user = await requireSignedInUser(
    locale,
    localizedPath(locale, "/account/courses"),
  );
  const t = await getTranslations("Auth");
  const certificatesT = await getTranslations("Certificates");
  const {upcoming, past} = await listMyCourses(user.id);
  const certificates = (await listOwnCertificates(user.id)).map((certificate) =>
    toCertificateCardView(certificate, locale),
  );
  const hasRegistrations = upcoming.length > 0 || past.length > 0;

  return (
    <AccountWorkspace locale={locale} current="courses">
      <WorkspacePage
        title={t("myCoursesTitle")}
        intro={t("myCoursesIntro")}
      >

        {hasRegistrations ? (
          <>
            <section className="mt-10">
              <h2 className="font-serif text-subheading">{t("upcomingTitle")}</h2>
              {upcoming.length === 0 ? (
                <p className="mt-4 text-sm leading-7 text-ink-muted">{t("upcomingEmpty")}</p>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {upcoming.map((booking) => (
                    <MyCourseCard
                      key={booking.id}
                      booking={booking}
                      locale={locale}
                      statusLabel={t(registrationStatusMessageKey(booking.status))}
                    />
                  ))}
                </div>
              )}
            </section>
            <section className="mt-12">
              <h2 className="font-serif text-subheading">{t("pastTitle")}</h2>
              {past.length === 0 ? (
                <p className="mt-4 text-sm leading-7 text-ink-muted">{t("pastEmpty")}</p>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {past.map((booking) => (
                    <MyCourseCard
                      key={booking.id}
                      booking={booking}
                      locale={locale}
                      statusLabel={t(registrationStatusMessageKey(booking.status))}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="mt-10 max-w-xl rounded-panel border border-ink bg-white p-5 sm:p-6">
            <p className="text-sm leading-7 text-ink-muted">{t("myCoursesEmpty")}</p>
            <Link href="/courses" className={`${buttonStyles()} mt-6`}>
              {t("browseCourses")}
            </Link>
          </div>
        )}

        <section className="mt-16 border-t border-ink pt-10">
          <h2 className="font-serif text-subheading">{certificatesT("sectionTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
            {certificatesT("intro")}
          </p>
          <CertificateLibrary certificates={certificates} />
        </section>
      </WorkspacePage>
    </AccountWorkspace>
  );
}
