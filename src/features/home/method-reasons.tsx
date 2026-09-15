import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";

export type MethodReason = {
  title: string;
  body: string;
};

export function MethodReasons({
  eyebrow,
  title,
  reasons,
}: {
  eyebrow: string;
  title: string;
  reasons: MethodReason[];
}) {
  return (
    <Section
      id="why-method"
      size="lg"
      ariaLabelledBy="why-title"
      className="border-t border-ink"
    >
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id="why-title" className="mt-4 font-serif text-heading">
          {title}
        </h2>
      </div>

      <ul className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5">
        {reasons.map((reason, index) => (
          <li key={reason.title} className="min-h-0">
            <Panel as="article" className="flex h-full flex-col">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink-subtle">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-serif text-subheading">{reason.title}</h3>
              <p className="mt-3 text-sm leading-7 text-ink-muted">{reason.body}</p>
            </Panel>
          </li>
        ))}
      </ul>
    </Section>
  );
}
