import {setRequestLocale} from "next-intl/server";

import {catalogueCalendarHref} from "@/i18n/href";
import {redirect} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";

type BookPageProps = {
  params: Promise<{locale: AppLocale}>;
};

export default async function QuickBookPage({params}: BookPageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  redirect({
    href: catalogueCalendarHref,
    locale,
  });
}
