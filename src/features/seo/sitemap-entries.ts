import type {MetadataRoute} from "next";

import {getPublishedCourses} from "@/features/courses/queries";
import type {Course} from "@/features/courses/types";
import {localizedPathname} from "@/i18n/path";
import {routing, type AppLocale, type AppPathname} from "@/i18n/routing";
import {getSiteUrl} from "@/lib/site-url";

type StaticPath = Exclude<
  AppPathname,
  | "/courses/[slug]"
  | "/courses/[slug]/book"
  | "/booking/fake-checkout"
  | "/staff/bookings"
  | "/sign-in"
  | "/sign-up"
  | "/forgot-password"
  | "/reset-password/[token]"
  | "/verify-email/[token]"
  | "/account"
  | "/account/courses"
  | "/invite/[token]"
  | "/admin"
  | "/admin/users"
  | "/admin/users/[id]"
  | "/admin/rooms"
  | "/admin/rooms/[id]"
  | "/admin/settings"
  | "/admin/bookings"
  | "/admin/bookings/new"
  | "/admin/bookings/[id]"
  | "/admin/requests"
  | "/admin/requests/[id]"
  | "/admin/billing"
  | "/admin/billing/[userId]"
  | "/admin/billing/[userId]/statements/[id]"
  | "/admin/courses"
  | "/admin/courses/[id]"
  | "/admin/notifications"
  | "/rooms"
  | "/rooms/book"
  | "/rooms/bookings"
  | "/rooms/bookings/[id]"
  | "/rooms/bookings/[id]/change"
  | "/rooms/bookings/[id]/cancel"
  | "/rooms/requests"
  | "/rooms/requests/new"
  | "/rooms/requests/[id]"
  | "/billing"
  | "/billing/statements/[id]"
  | "/billing/setup"
  | "/billing/payment-method/return"
  | "/access-denied"
>;

const publicStaticPaths: Array<{
  href: StaticPath;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  {href: "/", changeFrequency: "weekly", priority: 1},
  {href: "/courses", changeFrequency: "weekly", priority: 0.9},
  {href: "/contact", changeFrequency: "monthly", priority: 0.6},
  {href: "/legal/privacy", changeFrequency: "yearly", priority: 0.3},
  {href: "/legal/terms", changeFrequency: "yearly", priority: 0.3},
  {href: "/legal/imprint", changeFrequency: "yearly", priority: 0.3},
  {href: "/legal/terms-of-use", changeFrequency: "yearly", priority: 0.3},
  {href: "/legal/copyright", changeFrequency: "yearly", priority: 0.3},
];

export function buildSitemapEntries(
  publishedCourses: Course[] = getPublishedCourses(),
): MetadataRoute.Sitemap {
  const origin = getSiteUrl().origin;
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const page of publicStaticPaths) {
    entries.push(
      ...localizedEntry(
        origin,
        lastModified,
        page.changeFrequency,
        page.priority,
        (locale) => localizedPathname(locale, page.href),
      ),
    );
  }

  for (const course of publishedCourses) {
    entries.push(
      ...localizedEntry(
        origin,
        lastModified,
        "weekly",
        0.8,
        (locale) =>
          localizedPathname(locale, {
            pathname: "/courses/[slug]",
            params: {slug: course.slug[locale]},
          }),
      ),
    );
  }

  return entries;
}

function localizedEntry(
  origin: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
  pathForLocale: (locale: AppLocale) => string,
): MetadataRoute.Sitemap[number][] {
  const languages: Record<string, string> = {
    "x-default": `${origin}${pathForLocale("fr")}`,
  };

  for (const locale of routing.locales) {
    languages[locale] = `${origin}${pathForLocale(locale)}`;
  }

  return routing.locales.map((locale) => ({
    url: `${origin}${pathForLocale(locale)}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: {languages},
  }));
}
