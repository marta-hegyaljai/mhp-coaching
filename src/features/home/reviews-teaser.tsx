import {featuredTestimonials} from "@/features/school/testimonials";
import {TestimonialQuote} from "@/features/school/testimonial-quote";
import {Link} from "@/i18n/navigation";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";

export function ReviewsTeaser({
  eyebrow,
  title,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  linkLabel: string;
}) {
  return (
    <Section id="temoignages" size="lg" ariaLabelledBy="reviews-teaser-title">
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id="reviews-teaser-title" className="mt-4 font-serif text-heading">
          {title}
        </h2>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {featuredTestimonials.map((entry) => (
          <li key={entry.id}>
            <Panel as="article" className="flex h-full flex-col">
              <TestimonialQuote testimonial={entry} variant="card" />
            </Panel>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link
          href="/reviews"
          className="group/button inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink underline-offset-4 hover:underline"
        >
          {linkLabel}
          <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
        </Link>
      </div>
    </Section>
  );
}
