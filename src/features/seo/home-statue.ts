import type {AppLocale} from "@/i18n/routing";

export const homeStatue = {
  src: "/images/home/obelisk-jan-hegy.webp",
  width: 1600,
  height: 2400,
} as const;

export const homeStatueTitle = "Obelisk";
export const homeStatueArtist = "Jan Hegy";
export const homeStatueCredit = `${homeStatueTitle} — ${homeStatueArtist}`;

export const homeStatueAlt: Record<AppLocale, string> = {
  fr: "Obélisque, sculpture en bronze doré de Jan Hegy photographiée en studio, motif visuel de l’école d’hypnose MHP Coaching à Fribourg.",
  de: "Obelisk, vergoldete Bronzeskulptur von Jan Hegy im Studio fotografiert, visuelles Motiv der Hypnoseschule MHP Coaching in Freiburg.",
  en: "Obelisk, a gilded bronze sculpture by Jan Hegy photographed in the studio, a visual motif of the MHP Coaching hypnosis school in Fribourg.",
};
