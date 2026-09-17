import type {Testimonial} from "./testimonials";

/** `card` sits in the home-page grid; `list` is a row on the reviews page. */
export type TestimonialVariant = "card" | "list";

const quoteStyles: Record<TestimonialVariant, string> = {
  card: "font-serif text-subheading leading-7 text-ink",
  list: "font-serif text-subheading leading-8 text-ink",
};

const authorStyles: Record<TestimonialVariant, string> = {
  card: "mt-auto pt-4",
  list: "mt-3",
};

/**
 * One participant comment. The attribution is a `<footer>` inside the
 * `<blockquote>`, which is the semantic element for it and never takes the
 * `contentinfo` role that belongs to the page footer.
 */
export function TestimonialQuote({
  testimonial,
  variant,
}: {
  testimonial: Testimonial;
  variant: TestimonialVariant;
}) {
  return (
    <blockquote className={variant === "card" ? "flex h-full flex-col" : undefined}>
      <p className={quoteStyles[variant]}>« {testimonial.quote} »</p>
      {testimonial.author ? (
        <footer
          className={`${authorStyles[variant]} text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-subtle`}
        >
          <cite className="not-italic">— {testimonial.author}</cite>
        </footer>
      ) : null}
    </blockquote>
  );
}
