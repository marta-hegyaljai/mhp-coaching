import {hasLocale} from "next-intl";

import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";
import {routing, type AppLocale} from "@/i18n/routing";

/** Request-free FR/DE/EN lookup so cron and jobs can compose mail. */

const catalogs = {en, fr, de} as const;

function readNode(locale: AppLocale, namespace: string): Record<string, string> {
  let node: unknown = catalogs[locale];
  for (const part of namespace.split(".").filter(Boolean)) {
    node = (node as Record<string, unknown> | undefined)?.[part];
  }
  if (!node || typeof node !== "object") {
    throw new Error(`Missing email namespace ${namespace}`);
  }
  return node as Record<string, string>;
}

export function emailTranslator(locale: string, namespace: string) {
  const resolved: AppLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const tree = readNode(resolved, namespace);
  return (key: string, values?: Record<string, string | number>) => {
    let template = tree[key];
    if (typeof template !== "string") {
      throw new Error(`Missing email message ${namespace}.${key}`);
    }
    if (values) {
      for (const [name, value] of Object.entries(values)) {
        template = template.replaceAll(`{${name}}`, String(value));
      }
    }
    return template;
  };
}
