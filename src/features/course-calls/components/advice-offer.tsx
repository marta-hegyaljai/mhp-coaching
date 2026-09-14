import {Link} from "@/i18n/navigation";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";

export function CourseAdviceOffer({
  courseSlug,
  eyebrow,
  title,
  body,
  callLabel,
  writePrompt,
  writeLabel,
  className = "",
}: {
  courseSlug: string;
  eyebrow: string;
  title: string;
  body: string;
  callLabel: string;
  writePrompt: string;
  writeLabel: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold">
        {eyebrow}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-ink">{title}</p>
      <p className="mt-1 text-sm leading-6 text-ink-muted">{body}</p>
      <Link
        href={{
          pathname: "/courses/[slug]/advice",
          params: {slug: courseSlug},
        }}
        className={`${buttonStyles({variant: "secondary", block: true})} mt-4`}
      >
        {callLabel}
        <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
      </Link>
      <p className="mt-3 text-sm leading-6 text-ink-muted">
        {writePrompt}{" "}
        <Link
          href={{
            pathname: "/courses/[slug]/advice",
            params: {slug: courseSlug},
            query: {mode: "write"},
          }}
          className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4 hover:text-ink-muted"
        >
          {writeLabel}
        </Link>
      </p>
    </div>
  );
}
