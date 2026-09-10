import {getTranslations, setRequestLocale} from "next-intl/server";

import {MyCourseCard} from "@/features/account/components/my-course-card";
import {listMyCourses} from "@/features/account/my-courses";
import {registrationStatusMessageKey} from "@/features/account/status-label";
import {AccountNav} from "@/features/auth/components/account-nav";
import {requireSignedInUser} from "@/features/auth/require";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {Eyebrow, Section} from "@/shared/ui/layout";

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
  const navT = await getTranslations("Nav");
  const {upcoming, past} = await listMyCourses(user.id);

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-serif text-heading">{t("myCoursesTitle")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
          {t("myCoursesIntro")}
        </p>
        <AccountNav
          locale={locale}
          labels={{
            profile: t("profileTitle"),
            courses: t("myCoursesLink"),
            signOut: navT("signOut"),
          }}
        />

        {upcoming.length === 0 && past.length === 0 ? (
          <div className="mt-10 max-w-xl">
            <p className="text-sm leading-7 text-ink-muted">{t("myCoursesEmpty")}</p>
            <Link href="/courses" className={`${buttonStyles()} mt-6`}>
              {t("browseCourses")}
            </Link>
          </div>
        ) : (
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
        )}
      </Section>
    </SiteShell>
  );
}
