import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {AccessHistory} from "@/features/admin/components/access-history";
import {AdminSubnav, adminSectionLabels} from "@/features/admin/components/admin-subnav";
import {UserAccessForm} from "@/features/admin/components/user-access-form";
import {UserDiscountForm} from "@/features/admin/components/user-discount-form";
import {parseAuditHistoryPage, userAuditHref} from "@/features/admin/audit-history-query";
import {toAdminUserView} from "@/features/admin/user-view";
import {findUserById, listAuditForUserPage} from "@/features/auth/repository";
import {requireAdmin} from "@/features/auth/require";
import {AdminCertificatePanel} from "@/features/certificates/components/admin/panel";
import {listCertificatesForUser} from "@/features/certificates/repository";
import {toCertificateCardView} from "@/features/certificates/views";
import {getCatalogueCourses} from "@/features/courses/queries";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type AdminUserDetailPageProps = {
  params: Promise<{locale: AppLocale; id: string}>;
  searchParams: Promise<{history?: string | string[]}>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({params}: AdminUserDetailPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  return buildPageMetadata({
    locale,
    title: t("detailTitle"),
    description: t("intro"),
    hrefForLocale: () => "/admin/users",
    robots: {index: false, follow: false},
  });
}

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: AdminUserDetailPageProps) {
  const {locale, id} = await params;
  const historyPage = parseAuditHistoryPage(await searchParams);
  setRequestLocale(locale);
  await requireAdmin(locale, localizedPath(locale, userAuditHref(id, historyPage)));
  const t = await getTranslations("Admin");
  const user = await findUserById(id);

  if (!user) {
    notFound();
  }

  const view = toAdminUserView(user);
  const audit = await listAuditForUserPage(user.id, historyPage);
  const certificates = (await listCertificatesForUser(user.id)).map((certificate) =>
    toCertificateCardView(certificate, locale),
  );
  const courses = getCatalogueCourses().map((course) => ({
    id: course.id,
    title: course.title[locale],
  }));

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <AdminSubnav
          current="users"
          label={t("sectionsNav")}
          labels={adminSectionLabels(t)}
        />
        <p className="mt-4 text-sm">
          <Link href="/admin/users" className="underline-offset-4 hover:underline">
            {t("backToList")}
          </Link>
        </p>
        <h1 className="mt-3 font-serif text-heading">{t("detailTitle")}</h1>
        <p className="mt-4 font-sans text-lg font-medium break-all">{view.email}</p>
        <p className="mt-2 text-sm leading-7 text-ink-muted">
          {view.firstName} {view.lastName}
          {" · "}
          {view.disabled
            ? t("statusDisabled")
            : view.pendingInvite
              ? t("statusPending")
              : t("statusActive")}
        </p>
        <p className="mt-3">
          <Link
            href={{pathname: "/admin/billing/[userId]", params: {userId: user.id}}}
            className="text-sm underline-offset-4 hover:underline"
          >
            {t("viewUserBilling")}
          </Link>
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{t("identityNote")}</p>
        <div className="mt-10">
          <UserAccessForm locale={locale} user={view} />
        </div>
        <div className="mt-16">
          <UserDiscountForm locale={locale} user={view} />
        </div>
        <div className="mt-16">
          <AdminCertificatePanel
            locale={locale}
            userId={user.id}
            certificates={certificates}
            courses={courses}
          />
        </div>
        <div className="mt-16">
          <AccessHistory
            locale={locale}
            userId={user.id}
            events={audit.events}
            page={audit.page}
            pageCount={audit.pageCount}
            total={audit.total}
          />
        </div>
      </Section>
    </SiteShell>
  );
}
