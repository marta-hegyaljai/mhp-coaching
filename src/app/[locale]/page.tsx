import {getTranslations, setRequestLocale} from "next-intl/server";

import {LanguageSwitcher} from "@/components/language-switcher";
import type {AppLocale} from "@/i18n/routing";

type HomePageProps = {
  params: Promise<{locale: AppLocale}>;
};

export default async function HomePage({params}: HomePageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("HomePage");

  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 sm:py-10 lg:px-16">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-stone-300 pb-5">
        <span className="font-serif text-lg tracking-wide">MHP Hypnose</span>
        <LanguageSwitcher />
      </header>

      <section className="mx-auto flex min-h-[75vh] max-w-6xl items-center py-20 sm:py-28">
        <div className="max-w-3xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.24em] text-amber-900">
            {t("eyebrow")}
          </p>
          <h1 className="font-serif text-5xl leading-[0.98] tracking-[-0.035em] sm:text-7xl lg:text-8xl">
            {t("title")}
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-stone-700 sm:text-xl">
            {t("intro")}
          </p>
        </div>
      </section>
    </main>
  );
}
