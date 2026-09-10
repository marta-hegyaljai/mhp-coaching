import Image from "next/image";
import {getTranslations} from "next-intl/server";

import {
  homeStatue,
  homeStatueAlt,
  homeStatueCredit,
} from "@/features/seo/home-statue";
import {catalogueCalendarHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon, PinIcon} from "@/shared/ui/icons";

export async function HomeHero({locale}: {locale: AppLocale}) {
  const t = await getTranslations("HomePage");

  return (
    <section id="home-hero" aria-labelledby="home-hero-title" className="w-full">
      <div className="relative min-h-[36rem] lg:grid lg:min-h-[37.5rem] lg:grid-cols-2">
        <div className="relative z-10 px-4 pt-6 pb-40 sm:px-8 lg:flex lg:items-center lg:bg-ink lg:px-12 lg:py-16 lg:pb-16 xl:px-16">
          <div className="mx-auto w-full max-w-xl rounded-panel border border-line-soft bg-shell/90 p-5 sm:p-7 lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold">
              {t("eyebrow")}
            </p>
            <h1
              id="home-hero-title"
              className="mt-4 font-serif text-title text-ink lg:text-parchment"
            >
              {t("title")}
            </h1>
            <p className="mt-4 text-base leading-7 text-ink-muted lg:text-parchment/80">
              {t("intro")}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href="/courses"
                className={`${buttonStyles({variant: "primary", size: "lg"})} w-full sm:w-auto lg:border-parchment lg:bg-parchment lg:text-ink lg:hover:border-gold lg:hover:bg-gold lg:hover:text-ink lg:focus-visible:outline-parchment`}
              >
                {t("ctaCourses")}
                <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
              </Link>
              <Link
                href={catalogueCalendarHref}
                className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-ink underline-offset-4 hover:underline sm:text-base lg:text-parchment"
              >
                {t("ctaBook")}
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-line-soft pt-4 text-xs text-ink-muted sm:text-sm lg:border-parchment/20 lg:text-parchment/70">
              <li className="flex items-center gap-1.5">
                <PinIcon className="h-3.5 w-3.5" />
                {t("trustLocations")}
              </li>
              <li>{t("trustGroup")}</li>
              <li>{t("trustRecognition")}</li>
            </ul>
          </div>
        </div>

        <figure className="absolute inset-0 z-0 lg:relative lg:inset-auto lg:z-auto lg:h-full lg:bg-ink">
          <Image
            src={homeStatue.src}
            alt={homeStatueAlt[locale]}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-center lg:object-contain"
          />
          <figcaption className="absolute right-4 bottom-4 z-10 rounded-panel bg-shell/90 px-3 py-1.5 text-xs tracking-wide text-ink">
            {homeStatueCredit}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
