import {Eyebrow, Section} from "@/shared/ui/layout";

export function FounderQuote({
  eyebrow,
  quote,
  name,
  role,
}: {
  eyebrow: string;
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <Section
      id="founder-quote"
      size="md"
      tone="shell"
      ariaLabelledBy="founder-quote-title"
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <blockquote className="mt-6 max-w-3xl border-l-2 border-ink pl-5 sm:pl-6">
        <p id="founder-quote-title" className="font-serif text-heading leading-snug text-ink">
          {quote}
        </p>
        {/* A <footer> inside <blockquote> is the attribution; it never takes
            the contentinfo role, so it cannot collide with the page footer. */}
        <footer className="mt-5">
          <cite className="not-italic">
            <span className="block text-sm font-semibold text-ink">— {name}</span>
            <span className="mt-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
              {role}
            </span>
          </cite>
        </footer>
      </blockquote>
    </Section>
  );
}
