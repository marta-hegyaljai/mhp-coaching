import {getTranslations} from "next-intl/server";

import {homeGalleryPhotos} from "@/features/gallery/photos";
import {GalleryAlbum} from "@/features/home/gallery-album";
import type {AppLocale} from "@/i18n/routing";
import {Eyebrow, Section} from "@/shared/ui/layout";

export async function GalleryTeaser({locale}: {locale: AppLocale}) {
  const t = await getTranslations("HomePage");

  return (
    <Section size="sm" tone="shell" ariaLabelledBy="gallery-teaser-title">
      <div className="flex flex-col gap-4 border-b border-ink pb-5 md:flex-row md:items-end md:justify-between md:gap-10">
        <div className="max-w-xl">
          <Eyebrow>{t("galleryEyebrow")}</Eyebrow>
          <h2 id="gallery-teaser-title" className="mt-3 font-serif text-heading">
            {t("galleryTitle")}
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-ink-muted md:pb-1">
          {t("galleryBody")}
        </p>
      </div>

      <GalleryAlbum locale={locale} photos={homeGalleryPhotos} />
    </Section>
  );
}
