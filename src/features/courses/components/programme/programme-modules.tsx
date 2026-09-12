import {formatChf} from "@/features/payments/money";
import type {ProgrammeView} from "@/features/courses/programme";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Price} from "@/shared/ui/price";

export type ProgrammeModulesLabels = {
  title: string;
  intro: string;
  comparison: string | null;
  savings: string | null;
};

/** Contents of a programme, shown on its own course page. */
export function ProgrammeModules({
  view,
  locale,
  labels,
  headingId,
}: {
  view: ProgrammeView;
  locale: AppLocale;
  labels: ProgrammeModulesLabels;
  headingId: string;
}) {
  if (view.modules.length === 0) {
    return null;
  }

  return (
    <>
      <h2 id={headingId} className="font-serif text-heading">
        {labels.title}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">{labels.intro}</p>
      {labels.comparison ? (
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">
          {labels.comparison}
          {labels.savings ? (
            <span className="ml-2 font-sans text-sm font-semibold tabular-nums text-ink">
              {labels.savings}
            </span>
          ) : null}
        </p>
      ) : null}

      <ol className="mt-8 border border-ink bg-white">
        {view.modules.map((module, index) => (
          <li key={module.id} className="border-b border-line-soft last:border-b-0">
            <Link
              href={{pathname: "/courses/[slug]", params: {slug: module.slug[locale]}}}
              className="group/module flex min-h-16 flex-wrap items-center gap-x-5 gap-y-1 px-4 py-4 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink sm:px-6"
            >
              <span className="font-sans text-xs font-semibold tabular-nums text-ink-subtle">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 font-serif text-lg leading-tight">
                {module.title[locale]}
              </span>
              <span className="text-sm text-ink-subtle">{module.duration[locale]}</span>
              <Price size="sm">{formatChf(module.priceChf, locale, {compact: true})}</Price>
              <ArrowRightIcon className="h-4 w-4 shrink-0 transition-transform duration-150 ease-standard group-hover/module:translate-x-1" />
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
