import {getTranslations} from "next-intl/server";

import {Link} from "@/i18n/navigation";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Section} from "@/shared/ui/layout";

export default async function NotFoundPage() {
  const t = await getTranslations("NotFound");

  return (
    <Section size="lg">
      <div className="max-w-2xl">
        <p className="font-serif text-heading text-bronze">404</p>
        <h1 className="mt-4 font-serif text-title">{t("title")}</h1>
        <p className="mt-5 text-lead text-ink-muted">{t("body")}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/courses"
            className={`${buttonStyles({size: "lg"})} w-full sm:w-auto`}
          >
            {t("courses")}
            <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
          </Link>
          <Link
            href="/"
            className={`${buttonStyles({variant: "secondary", size: "lg"})} w-full sm:w-auto`}
          >
            {t("home")}
          </Link>
        </div>
      </div>
    </Section>
  );
}
