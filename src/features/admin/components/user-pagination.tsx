import {userListHrefForPage, type UserListQuery} from "@/features/admin/user-list-query";
import {Link} from "@/i18n/navigation";

export function UserListPagination({
  query,
  page,
  pageCount,
  labels,
}: {
  query: UserListQuery;
  page: number;
  pageCount: number;
  labels: {
    previous: string;
    next: string;
    pageStatus: string;
  };
}) {
  if (pageCount <= 1) {
    return null;
  }

  const previous = page > 1 ? userListHrefForPage(query, page - 1) : null;
  const next = page < pageCount ? userListHrefForPage(query, page + 1) : null;

  return (
    <nav
      aria-label={labels.pageStatus}
      className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm"
    >
      {previous ? (
        <Link
          href={previous}
          className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
        >
          {labels.previous}
        </Link>
      ) : (
        <span className="inline-flex min-h-11 items-center text-ink-subtle">{labels.previous}</span>
      )}
      <p className="text-ink-muted">{labels.pageStatus}</p>
      {next ? (
        <Link
          href={next}
          className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
        >
          {labels.next}
        </Link>
      ) : (
        <span className="inline-flex min-h-11 items-center text-ink-subtle">{labels.next}</span>
      )}
    </nav>
  );
}
