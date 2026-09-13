import {Link} from "@/i18n/navigation";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Price} from "@/shared/ui/price";

import type {ProgrammeCardModel} from "./programme-card-model";

/**
 * Category closer for a bundled path: enough content to choose, short enough
 * that the next category stays in reach on a phone.
 */
export function ProgrammeCard({
  model,
  headingLevel = "h3",
}: {
  model: ProgrammeCardModel;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const courseHref = {
    pathname: "/courses/[slug]",
    params: {slug: model.slug},
  } as const;

  return (
    <article
      data-catalogue-programme=""
      className="overflow-hidden rounded-panel border border-ink"
    >
      <div className="bg-ink px-5 py-3.5 text-parchment sm:px-6 sm:py-4">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold">
          {model.eyebrow}
        </p>
        <Heading className="mt-2 font-serif text-[clamp(1.35rem,2vw,1.65rem)] leading-[1.08]">
          {model.title}
        </Heading>
        <p className="mt-2 line-clamp-3 max-w-2xl text-sm leading-6 text-parchment/80">
          {model.summary}
        </p>
      </div>

      <div className="grid gap-4 bg-white p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_16.5rem] md:items-center md:gap-8">
        {model.modules.length > 0 ? (
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line-soft pb-2">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink-subtle">
                {model.includesTitle}
              </p>
              <p className="font-sans text-xs tabular-nums text-ink-subtle">
                {model.includesCount}
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-x-3">
              {model.modules.map((module) => (
                <li key={module.id}>
                  <Link
                    href={{pathname: "/courses/[slug]", params: {slug: module.slug}}}
                    className="flex min-h-11 flex-col justify-center border-b border-line-soft py-1.5 text-sm text-ink transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    <span className="min-w-0 leading-5">{module.title}</span>
                    <span className="font-sans text-xs tabular-nums text-ink-subtle">
                      {module.duration}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col justify-center gap-3 border-t border-line-soft pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 md:block">
            <Price size="sm">{model.price}</Price>
            <p className="text-sm leading-6 text-ink-subtle">
              {model.duration}
              <span aria-hidden="true"> · </span>
              {model.location}
              <span className="md:hidden">
                <span aria-hidden="true"> · </span>
                {model.schedule}
              </span>
            </p>
            <p className="mt-1 hidden text-sm leading-6 text-ink-subtle md:block">
              {model.schedule}
            </p>
          </div>
          {model.comparison ? (
            <p className="text-sm leading-6 text-ink-muted">{model.comparison}</p>
          ) : null}
          {model.savings ? (
            <p className="font-sans text-sm font-semibold tabular-nums text-ink">
              {model.savings}
            </p>
          ) : null}
          <Link href={courseHref} className={buttonStyles({size: "md", block: true})}>
            {model.ctaLabel}
            <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
