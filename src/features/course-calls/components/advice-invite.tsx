import {adviceHref, generalAdvice} from "@/features/course-calls/advice-route";
import {Link} from "@/i18n/navigation";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Eyebrow} from "@/shared/ui/layout";
import {Panel} from "@/shared/ui/panel";

/**
 * Compact entry point to the standalone advice page, for visitors who want to
 * talk before they have settled on a course. Each host page supplies its own
 * copy; the destination is always the general advice page.
 */
export function AdviceInvite({
  headingId,
  eyebrow,
  title,
  body,
  writePrompt,
  writeLabel,
  callLabel,
  className = "",
}: {
  /** Unique per page: names the panel's region for assistive technology. */
  headingId: string;
  eyebrow: string;
  title: string;
  body: string;
  writePrompt: string;
  writeLabel: string;
  callLabel: string;
  className?: string;
}) {
  return (
    <Panel
      as="section"
      ariaLabelledBy={headingId}
      className={`flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 ${className}`}
    >
      <div className="max-w-xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id={headingId} className="mt-3 font-serif text-subheading">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-7 text-ink-muted">{body}</p>
        <p className="mt-2 text-sm leading-7 text-ink-muted">
          {writePrompt}{" "}
          <Link
            href={adviceHref(generalAdvice, {mode: "write"})}
            className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4 hover:text-ink-muted"
          >
            {writeLabel}
          </Link>
        </p>
      </div>
      <Link
        href={adviceHref(generalAdvice)}
        className={`${buttonStyles({size: "lg"})} w-full shrink-0 sm:w-auto`}
      >
        {callLabel}
        <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
      </Link>
    </Panel>
  );
}
