import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {UserAccessForm} from "@/features/admin/components/user-access-form";
import {toAdminUserView} from "@/features/admin/user-view";
import {findUserById, listAuditForUser} from "@/features/auth/repository";
import {requireAdmin} from "@/features/auth/require";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

type AdminUserDetailPageProps = {
  params: Promise<{locale: AppLocale; id: string}>;
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

export default async function AdminUserDetailPage({params}: AdminUserDetailPageProps) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  await requireAdmin(locale, localizedPath(locale, {
    pathname: "/admin/users/[id]",
    params: {id},
  }));
  const t = await getTranslations("Admin");
  const user = await findUserById(id);

  if (!user) {
    notFound();
  }

  const view = toAdminUserView(user);
  const audit = await listAuditForUser(user.id);

  return (
    <SiteShell locale={locale} footerCta={null}>
      <Section size="sm" className="pt-10 pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
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
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{t("identityNote")}</p>
        <div className="mt-10">
          <UserAccessForm locale={locale} user={view} />
        </div>
        <div className="mt-16">
          <h2 className="font-serif text-subheading">{t("auditTitle")}</h2>
          {audit.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">{t("auditEmpty")}</p>
          ) : (
            <ol className="mt-6 space-y-4">
              {audit.map((event) => (
                <li key={event.id} className="border border-ink px-4 py-4 text-sm">
                  <p className="font-medium">{event.action}</p>
                  <p className="mt-1 text-ink-muted">{event.createdAt.toISOString()}</p>
                  <p className="mt-2 text-ink-subtle">
                    {t("auditActor")}: {event.actorUserId ?? t("auditSystem")}
                  </p>
                  <p className="mt-1 text-ink-subtle">
                    {t("auditBefore")}: {JSON.stringify(event.before ?? {})}
                  </p>
                  <p className="mt-1 text-ink-subtle">
                    {t("auditAfter")}: {JSON.stringify(event.after ?? {})}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Section>
    </SiteShell>
  );
}
