import Image from "next/image";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {galleryLeadPhoto, galleryPhotos} from "@/features/gallery/photos";
import {BreadcrumbTrail} from "@/features/seo/breadcrumb-trail";
import {buildPageMetadata, localizedPath} from "@/features/seo/metadata";
import {SiteShell} from "@/features/site-shell/site-shell";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {Eyebrow, Section} from "@/shared/ui/layout";

type GalleryPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export async function generateMetadata({params}: GalleryPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "GalleryPage"});

  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    hrefForLocale: () => "/gallery",
    image: {
      url: galleryLeadPhoto.src,
      width: galleryLeadPhoto.width,
      height: galleryLeadPhoto.height,
      alt: galleryLeadPhoto.alt[locale],
    },
  });
}

export default async function GalleryPage({params}: GalleryPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("GalleryPage");
  const navT = await getTranslations("Nav");
  const homeT = await getTranslations("CoursesPage");
  const pagePath = localizedPath(locale, "/gallery");
  const supportingPhotos = galleryPhotos.slice(1);

  return (
    <SiteShell locale={locale}>
      <Section size="sm" className="pt-8 pb-10 sm:pb-14">
        <BreadcrumbTrail
          label={navT("breadcrumb")}
          items={[
            {name: homeT("breadcrumbHome"), path: localizedPath(locale, "/")},
            {name: t("title"), path: pagePath},
          ]}
        />

        <div className="mt-8 grid gap-8 border-b border-ink pb-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h1 className="mt-4 font-serif text-title">{t("title")}</h1>
          </div>
          <p className="text-lead text-ink-muted lg:col-span-5 lg:self-end">
            {t("lead")}
          </p>
        </div>
      </Section>

      <div className="mx-auto w-full max-w-[90rem] px-0 sm:px-8 lg:px-10">
        <figure className="relative aspect-[4/3] overflow-hidden bg-ink sm:aspect-[16/8] lg:aspect-[16/7]">
          <Image
            src={galleryLeadPhoto.src}
            alt={galleryLeadPhoto.alt[locale]}
            fill
            priority
            sizes="(min-width: 1440px) 1440px, 100vw"
            className="object-cover object-center"
          />
        </figure>
      </div>

      <Section ariaLabelledBy="gallery-moments-title">
        <div className="grid gap-7 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Eyebrow>{t("momentsEyebrow")}</Eyebrow>
            <h2 id="gallery-moments-title" className="mt-4 font-serif text-heading">
              {t("momentsTitle")}
            </h2>
          </div>
          <p className="text-base leading-8 text-ink-muted lg:col-span-7 lg:text-lg">
            {t("momentsBody")}
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {supportingPhotos.map((photo) => (
            <figure
              key={photo.id}
              className="relative aspect-[3/2] overflow-hidden border border-ink bg-ink"
            >
              <Image
                src={photo.src}
                alt={photo.alt[locale]}
                fill
                sizes="(min-width: 768px) 58vw, 100vw"
                className="object-cover"
              />
            </figure>
          ))}
        </div>

        <p className="mt-5 text-xs text-ink-subtle">{t("credit")}</p>

        <div className="mt-10 flex flex-col gap-3 border-t border-ink pt-8 sm:flex-row">
          <Link href="/courses" className={buttonStyles()}>
            {t("coursesCta")}
          </Link>
          <Link href="/contact" className={buttonStyles({variant: "secondary"})}>
            {t("contactCta")}
          </Link>
        </div>
      </Section>
    </SiteShell>
  );
}
