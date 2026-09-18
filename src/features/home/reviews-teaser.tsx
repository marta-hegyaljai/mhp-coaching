import {featuredTestimonials} from "@/features/school/testimonials";
import {TestimonialQuote} from "@/features/school/testimonial-quote";
import {Link} from "@/i18n/navigation";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";
import {buttonStyles} from "@/shared/ui/button";

export function ReviewsTeaser({
  eyebrow,
  title,
  linkLabel,
  countLabel,
  anonymousLabel,
  participantLabel,
}: {
  eyebrow: string;
  title: string;
  linkLabel: string;
  countLabel: string;
  anonymousLabel: string;
  participantLabel: string;
}) {
  return (
    <Section
      id="temoignages"
      size="lg"
      tone="shell"
      ariaLabelledBy="reviews-teaser-title"
    >
      <div className="flex flex-col gap-6 border-b border-ink pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 id="reviews-teaser-title" className="mt-4 font-serif text-heading">
            {title}
          </h2>
          <p className="mt-3 text-sm text-ink-subtle">{countLabel}</p>
        </div>

        <Link
          href="/reviews"
          className={`${buttonStyles({variant: "secondary"})} hidden shrink-0 sm:inline-flex`}
        >
          {linkLabel}
          <ArrowRightIcon className="transition-transform duration-150 ease-standard group-hover/button:translate-x-1" />
        </Link>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {featuredTestimonials.map((entry) => (
          <li key={entry.id}>
            <Panel as="article" padding="sm" className="flex h-full flex-col">
              <TestimonialQuote
                testimonial={entry}
                variant="featured"
                anonymousLabel={anonymousLabel}
                participantLabel={participantLabel}
              />
            </Panel>
          </li>
        ))}
      </ul>

      <div className="mt-6 sm:hidden">
        <Link
          href="/reviews"
          className={buttonStyles({variant: "secondary", block: true})}
        >
          {linkLabel}
          <ArrowRightIcon className="transition-transform duration-150 ease-standard group-hover/button:translate-x-1" />
        </Link>
      </div>
    </Section>
  );
}
