"use client";

import {useState} from "react";

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
  mobileCallLabel,
  minimizeLabel,
  expandLabel,
  collapsedLabel,
  compact = false,
  floating = false,
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
  mobileCallLabel?: string;
  minimizeLabel?: string;
  expandLabel?: string;
  collapsedLabel?: string;
  compact?: boolean;
  floating?: boolean;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(true);

  if (floating && !expanded) {
    return (
      <button
        type="button"
        aria-expanded="false"
        aria-label={expandLabel}
        onClick={() => setExpanded(true)}
        className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 flex min-h-11 items-center gap-3 rounded-panel border border-ink bg-white px-3 text-ink transition-colors duration-150 hover:bg-hover sm:right-6 sm:bottom-6"
      >
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em]">
          {collapsedLabel ?? mobileCallLabel ?? eyebrow}
        </span>
        <span aria-hidden="true" className="text-lg leading-none">
          +
        </span>
      </button>
    );
  }

  return (
    <Panel
      as="section"
      ariaLabelledBy={headingId}
      padding={compact ? "sm" : "md"}
      className={`grid border-l-4 ${compact ? "gap-3" : "gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8"} ${floating ? "fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 w-52 bg-white max-sm:!p-3 sm:right-6 sm:bottom-6 sm:w-80" : ""} ${className}`}
    >
      {floating ? (
        <button
          type="button"
          aria-expanded="true"
          aria-label={minimizeLabel}
          onClick={() => setExpanded(false)}
          className="absolute top-1 right-1 flex size-11 items-center justify-center text-xl leading-none text-ink-subtle transition-colors duration-150 hover:bg-hover hover:text-ink"
        >
          <span aria-hidden="true">−</span>
        </button>
      ) : null}
      <div className={`max-w-xl ${floating ? "pr-10" : ""}`}>
        <Eyebrow>
          {floating && collapsedLabel ? (
            <>
              <span className="sm:hidden">{collapsedLabel}</span>
              <span className="max-sm:hidden">{eyebrow}</span>
            </>
          ) : (
            eyebrow
          )}
        </Eyebrow>
        <h2
          id={headingId}
          className={`${compact ? "mt-1.5 text-lg leading-6" : "mt-3 text-subheading"} ${floating ? "max-sm:sr-only" : ""} font-serif`}
        >
          {title}
        </h2>
        {compact ? null : (
          <p className="mt-2 text-sm leading-7 text-ink-muted">{body}</p>
        )}
      </div>
      <div className="flex flex-col items-stretch gap-1 sm:items-end">
        <Link
          href={adviceHref(generalAdvice)}
          className={`${buttonStyles({size: compact ? "md" : "lg"})} w-full shrink-0 ${compact ? "" : "sm:w-auto"}`}
        >
          {floating && mobileCallLabel ? (
            <>
              <span className="sm:hidden">{mobileCallLabel}</span>
              <span className="max-sm:hidden">{callLabel}</span>
            </>
          ) : (
            callLabel
          )}
          <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
        </Link>
        <p
          className={`${floating ? "max-sm:hidden" : ""} text-sm leading-6 text-ink-muted`}
        >
          {compact ? null : <>{writePrompt}{" "}</>}
          <Link
            href={adviceHref(generalAdvice, {mode: "write"})}
            className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4 hover:text-ink-muted"
          >
            {writeLabel}
          </Link>
        </p>
      </div>
    </Panel>
  );
}
