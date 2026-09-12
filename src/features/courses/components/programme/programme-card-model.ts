import {formatCourseDateRange} from "@/features/courses/dates";
import type {ProgrammeView} from "@/features/courses/programme";
import {getBookableDates} from "@/features/courses/queries";
import {formatChf} from "@/features/payments/money";
import type {AppLocale} from "@/i18n/routing";

/** Copy resolved by the caller, which owns the typed next-intl translator. */
export type ProgrammeCopy = {
  eyebrow: string;
  includesTitle: string;
  includesCount: (count: number) => string;
  altPrompt: (title: string) => string;
  comparison: (price: string) => string;
  savings: (amount: string) => string;
  bookCta: string;
  waitlistCta: string;
  awaitingDates: string;
};

export type ProgrammeModuleLink = {
  id: string;
  title: string;
  duration: string;
  slug: string;
};

/**
 * Plain, serializable view of a programme so the presentational card can live
 * in the client tree while all formatting stays on the server.
 */
export type ProgrammeCardModel = {
  id: string;
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
  duration: string;
  location: string;
  price: string;
  comparison: string | null;
  savings: string | null;
  altPrompt: string;
  includesTitle: string;
  includesCount: string;
  modules: ProgrammeModuleLink[];
  schedule: string;
  ctaLabel: string;
};

export function buildProgrammeCardModel(
  view: ProgrammeView,
  locale: AppLocale,
  copy: ProgrammeCopy,
  now = new Date(),
): ProgrammeCardModel {
  const {programme, modules, modulesPriceChf, savingsChf} = view;
  const dates = getBookableDates(programme, now);
  const nextDate = dates[0];
  const showComparison = savingsChf > 0;

  return {
    id: programme.id,
    slug: programme.slug[locale],
    eyebrow: copy.eyebrow,
    title: programme.title[locale],
    summary: programme.shortDescription[locale],
    duration: programme.duration[locale],
    location: programme.location[locale],
    price: formatChf(programme.priceChf, locale, {compact: true}),
    comparison: showComparison
      ? copy.comparison(formatChf(modulesPriceChf, locale, {compact: true}))
      : null,
    savings: showComparison
      ? copy.savings(formatChf(savingsChf, locale, {compact: true}))
      : null,
    altPrompt: copy.altPrompt(programme.title[locale]),
    includesTitle: copy.includesTitle,
    includesCount: copy.includesCount(modules.length),
    modules: modules.map((module) => ({
      id: module.id,
      title: module.title[locale],
      duration: module.duration[locale],
      slug: module.slug[locale],
    })),
    schedule: nextDate ? formatCourseDateRange(nextDate, locale) : copy.awaitingDates,
    ctaLabel: nextDate ? copy.bookCta : copy.waitlistCta,
  };
}
