import {Link} from "@/i18n/navigation";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon, CalendarIcon, PinIcon} from "@/shared/ui/icons";
import {Price} from "@/shared/ui/price";

import type {ProgrammeCardModel} from "./programme-card-model";

/**
 * Bundled learning path presented as an alternative to booking modules one by
 * one. The inverted header keeps it visually apart from the module grid.
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
    <article className="overflow-hidden rounded-panel border border-ink bg-white">
      <div className="bg-ink px-5 py-6 text-parchment sm:px-7">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold">
          {model.eyebrow}
        </p>
        <Heading className="mt-3 font-serif text-[clamp(1.6rem,2.4vw,2.1rem)] leading-[1.08]">
          {model.title}
        </Heading>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-parchment/80">
          {model.altPrompt}
        </p>
      </div>

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-10">
        <div>
          <p className="text-base leading-7 text-ink-muted">{model.summary}</p>

          {model.modules.length > 0 ? (
            <div className="mt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line-soft pb-2">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink-subtle">
                  {model.includesTitle}
                </p>
                <p className="font-sans text-xs tabular-nums text-ink-subtle">
                  {model.includesCount}
                </p>
              </div>
              <ul className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {model.modules.map((module) => (
                  <li key={module.id}>
                    <Link
                      href={{pathname: "/courses/[slug]", params: {slug: module.slug}}}
                      className="flex min-h-9 items-baseline justify-between gap-3 border-b border-line-soft py-1.5 text-sm text-ink transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      <span className="min-w-0">{module.title}</span>
                      <span className="shrink-0 font-sans text-xs tabular-nums text-ink-subtle">
                        {module.duration}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-subtle">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              {model.schedule}
            </span>
            <span className="flex items-center gap-1.5">
              <PinIcon className="h-3.5 w-3.5" />
              {model.location}
            </span>
          </div>
        </div>

        <div className="border-t border-line-soft pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <Price size="lg">{model.price}</Price>
          <p className="mt-1 text-sm text-ink-subtle">{model.duration}</p>
          {model.comparison ? (
            <p className="mt-3 text-sm leading-6 text-ink-muted">{model.comparison}</p>
          ) : null}
          {model.savings ? (
            <p className="mt-1 font-sans text-sm font-semibold tabular-nums text-ink">
              {model.savings}
            </p>
          ) : null}
          <Link
            href={courseHref}
            className={`${buttonStyles({size: "lg", block: true})} mt-5`}
          >
            {model.ctaLabel}
            <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
