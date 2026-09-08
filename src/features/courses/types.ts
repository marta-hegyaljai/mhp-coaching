import type {AppLocale} from "@/i18n/routing";

export type LocalizedText = Record<AppLocale, string>;

export type CourseDate = {
  id: string;
  startDate: string;
  endDate?: string;
  location: LocalizedText;
  venue?: LocalizedText;
  capacity: number;
  active: boolean;
};

export type Course = {
  id: string;
  slug: LocalizedText;
  title: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
  audience: LocalizedText;
  duration: LocalizedText;
  priceChf: number;
  category: "foundation" | "advanced";
  dates: CourseDate[];
};
