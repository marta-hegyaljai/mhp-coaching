import {ImageResponse} from "next/og";
import {hasLocale} from "next-intl";
import {getTranslations} from "next-intl/server";

import {routing} from "@/i18n/routing";

export const size = {width: 1200, height: 630};
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const resolvedLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "Metadata",
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          color: "#090909",
          padding: 72,
          border: "16px solid #090909",
        }}
      >
        <div style={{fontSize: 28, letterSpacing: 6, textTransform: "uppercase"}}>
          mhp-coaching
        </div>
        <div style={{fontSize: 58, lineHeight: 1.1, maxWidth: 900}}>
          {t("title")}
        </div>
      </div>
    ),
    size,
  );
}
