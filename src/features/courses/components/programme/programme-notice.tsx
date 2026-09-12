import type {Course} from "@/features/courses/types";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {ArrowRightIcon} from "@/shared/ui/icons";

/**
 * Shown on a module page when the module is also sold inside a programme, so
 * the complete-path option stays discoverable from the module itself.
 */
export function ProgrammeNotice({
  programmes,
  locale,
  eyebrow,
  promptFor,
  linkLabel,
  className = "",
}: {
  programmes: Course[];
  locale: AppLocale;
  eyebrow: string;
  promptFor: (title: string) => string;
  linkLabel: string;
  className?: string;
}) {
  if (programmes.length === 0) {
    return null;
  }

  return (
    <div className={`border border-ink bg-shell p-5 ${className}`}>
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold-deep">
        {eyebrow}
      </p>
      <ul className="mt-3 grid gap-4">
        {programmes.map((programme) => (
          <li key={programme.id}>
            <p className="text-sm leading-7 text-ink-muted">
              {promptFor(programme.title[locale])}
            </p>
            <Link
              href={{pathname: "/courses/[slug]", params: {slug: programme.slug[locale]}}}
              className="group/link mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {linkLabel}
              <ArrowRightIcon className="transition-transform duration-150 ease-standard group-hover/link:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
