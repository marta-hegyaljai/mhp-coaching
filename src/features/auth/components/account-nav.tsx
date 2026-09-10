import {signOutAction} from "@/features/auth/actions";
import {Link} from "@/i18n/navigation";

const itemClass =
  "text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink underline-offset-4 hover:underline";

export function AccountNav({
  locale,
  labels,
}: {
  locale: string;
  labels: {
    profile: string;
    courses: string;
    signOut: string;
  };
}) {
  return (
    <nav aria-label={labels.profile} className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
      <Link href="/account" className={itemClass}>
        {labels.profile}
      </Link>
      <Link href="/account/courses" className={itemClass}>
        {labels.courses}
      </Link>
      <form action={signOutAction.bind(null, locale)}>
        <button type="submit" className={itemClass}>
          {labels.signOut}
        </button>
      </form>
    </nav>
  );
}
