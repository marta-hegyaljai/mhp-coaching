import type {AppLocale} from "@/i18n/routing";

export const homeStatue = {
  src: "/images/home/hypnosis-statue.webp",
  width: 960,
  height: 708,
} as const;

export const homeStatueAlt: Record<AppLocale, string> = {
  fr: "Sculpture abstraite en pierre sombre photographiée en noir et blanc, motif visuel de l’école d’hypnose MHP Coaching à Fribourg.",
  de: "Abstrakte dunkle Steinskulptur in Schwarz-weiss, visuelles Motiv der Hypnoseschule MHP Coaching in Freiburg.",
  en: "Abstract dark stone sculpture in black and white, a visual motif of the MHP Coaching hypnosis school in Fribourg.",
};
