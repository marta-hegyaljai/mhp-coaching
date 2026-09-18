import type {Testimonial} from "./testimonials";

/** `featured` sits in the home-page grid; `archive` fills the reviews wall. */
export type TestimonialVariant = "featured" | "archive";

function avatarInitial(author?: string): string {
  return author?.trim().charAt(0).toLocaleUpperCase("fr") || "M";
}

/**
 * One participant comment. The attribution is a `<footer>` inside the
 * `<blockquote>`, which is the semantic element for it and never takes the
 * `contentinfo` role that belongs to the page footer.
 */
export function TestimonialQuote({
  testimonial,
  variant,
  anonymousLabel,
  participantLabel,
}: {
  testimonial: Testimonial;
  variant: TestimonialVariant;
  anonymousLabel: string;
  participantLabel: string;
}) {
  const author = testimonial.author ?? anonymousLabel;

  return (
    <blockquote
      className={`flex flex-col ${variant === "featured" ? "h-full" : ""}`}
    >
      <footer className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white"
        >
          {avatarInitial(testimonial.author)}
        </span>
        <span className="min-w-0">
          <cite className="block truncate text-sm font-semibold not-italic text-ink">
            {author}
          </cite>
          <span className="mt-0.5 block text-xs text-ink-subtle">
            {participantLabel}
          </span>
        </span>
      </footer>

      <p
        className={`${variant === "featured" ? "mt-5 text-[0.95rem] leading-7" : "mt-4 text-sm leading-6"} text-ink-muted`}
      >
        {testimonial.quote}
      </p>
    </blockquote>
  );
}
