import {Link} from "@/i18n/navigation";

export function CourseWaitlistLink({
  courseSlug,
  prompt,
  label,
  className = "",
}: {
  courseSlug: string;
  prompt: string;
  label: string;
  className?: string;
}) {
  return (
    <p className={`text-sm leading-6 text-ink-muted ${className}`.trim()}>
      {prompt}{" "}
      <Link
        href={{
          pathname: "/courses/[slug]/book",
          params: {slug: courseSlug},
          query: {waitlist: "1"},
        }}
        className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4 hover:text-ink-muted"
      >
        {label}
      </Link>
    </p>
  );
}
