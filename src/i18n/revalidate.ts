import {revalidatePath} from "next/cache";

import type {PathnameHref} from "@/i18n/href";
import {localizedPathname} from "@/i18n/path";
import {routing} from "@/i18n/routing";

export function revalidateLocalized(href: PathnameHref): void {
  for (const locale of routing.locales) {
    revalidatePath(localizedPathname(locale, href));
  }
}
