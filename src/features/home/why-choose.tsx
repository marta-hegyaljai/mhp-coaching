import {whyChooseBlocks} from "@/features/school/why-choose";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Eyebrow, Section} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";

const cardLink =
  "group/button mt-auto inline-flex min-h-11 items-center gap-2 pt-4 text-sm font-semibold underline-offset-4 hover:underline";

export function WhyChoose({
  locale,
  eyebrow,
  title,
  intro,
  askTitle,
  askBody,
  askLink,
}: {
  locale: AppLocale;
  eyebrow: string;
  title: string;
  intro: string;
  askTitle: string;
  askBody: string;
  askLink: string;
}) {
  return (
    <Section
      id="pourquoi-choisir"
      size="lg"
      ariaLabelledBy="why-choose-title"
      className="border-t border-ink"
    >
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id="why-choose-title" className="mt-4 font-serif text-heading">
          {title}
        </h2>
        <p className="mt-4 text-base leading-7 text-ink-muted">{intro}</p>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {whyChooseBlocks.map((block) => (
          <li key={block.id} id={block.id} className="scroll-mt-24">
            <Panel
              as="article"
              ariaLabelledBy={`${block.id}-title`}
              className="flex h-full flex-col"
            >
              <h3 id={`${block.id}-title`} className="font-serif text-subheading">
                {block.title[locale]}
              </h3>
              <p className="mt-3 text-sm leading-7 text-ink-muted">
                {block.body[locale]}
              </p>
              <Link href={block.pathname} className={`${cardLink} text-ink`}>
                {block.link[locale]}
                <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
              </Link>
            </Panel>
          </li>
        ))}

        {/* Eighth tile: closes the four-column grid and answers the one thing
            the seven claims cannot cover. */}
        <li>
          <Panel
            as="article"
            tone="ink"
            ariaLabelledBy="why-choose-ask-title"
            className="flex h-full flex-col"
          >
            <h3 id="why-choose-ask-title" className="font-serif text-subheading">
              {askTitle}
            </h3>
            <p className="mt-3 text-sm leading-7 text-parchment/70">{askBody}</p>
            <Link href="/contact" className={`${cardLink} text-parchment`}>
              {askLink}
              <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
            </Link>
          </Panel>
        </li>
      </ul>
    </Section>
  );
}
