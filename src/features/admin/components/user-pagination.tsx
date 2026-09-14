import {userListHrefForPage, type UserListQuery} from "@/features/admin/user-list-query";
import {Pagination} from "@/shared/ui/pagination";

export function UserListPagination({
  query,
  page,
  pageCount,
  labels,
  className = "mt-6",
}: {
  query: UserListQuery;
  page: number;
  pageCount: number;
  labels: {
    previous: string;
    next: string;
    pageStatus: string;
  };
  className?: string;
}) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <Pagination
      className={className}
      previous={page > 1 ? userListHrefForPage(query, page - 1) : null}
      next={page < pageCount ? userListHrefForPage(query, page + 1) : null}
      status={labels.pageStatus}
      labels={{previous: labels.previous, next: labels.next}}
    />
  );
}
