import {USER_LIST_ACCESS, USER_LIST_STATUSES, type UserListQuery} from "@/features/admin/user-list-query";
import {localizedPath} from "@/features/seo/metadata";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";

const fieldClass =
  "mt-2 block min-h-11 w-full rounded-panel border border-line bg-white px-3 text-base text-ink focus:border-ink focus:outline-none";

export function UserListFilters({
  locale,
  query,
  labels,
}: {
  locale: AppLocale;
  query: UserListQuery;
  labels: {
    search: string;
    searchPlaceholder: string;
    status: string;
    access: string;
    filter: string;
    clear: string;
    statusAll: string;
    statusActive: string;
    statusPending: string;
    statusDisabled: string;
    accessAll: string;
    accessAdmin: string;
    accessRooms: string;
    accessNone: string;
  };
}) {
  const statusLabels: Record<(typeof USER_LIST_STATUSES)[number], string> = {
    all: labels.statusAll,
    active: labels.statusActive,
    pending: labels.statusPending,
    disabled: labels.statusDisabled,
  };
  const accessLabels: Record<(typeof USER_LIST_ACCESS)[number], string> = {
    all: labels.accessAll,
    admin: labels.accessAdmin,
    rooms: labels.accessRooms,
    none: labels.accessNone,
  };

  return (
    <form
      method="get"
      action={localizedPath(locale, "/admin/users")}
      className="grid gap-3 border border-ink bg-white p-4 sm:grid-cols-[minmax(0,1fr)_11rem_11rem_auto] sm:items-end"
    >
      <div>
        <label htmlFor="user-search" className="block text-sm font-medium text-ink">
          {labels.search}
        </label>
        <input
          id="user-search"
          name="q"
          type="search"
          defaultValue={query.q}
          placeholder={labels.searchPlaceholder}
          autoComplete="off"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="user-status" className="block text-sm font-medium text-ink">
          {labels.status}
        </label>
        <select id="user-status" name="status" defaultValue={query.status} className={fieldClass}>
          {USER_LIST_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="user-access" className="block text-sm font-medium text-ink">
          {labels.access}
        </label>
        <select id="user-access" name="access" defaultValue={query.access} className={fieldClass}>
          {USER_LIST_ACCESS.map((access) => (
            <option key={access} value={access}>
              {accessLabels[access]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-h-11 flex-wrap items-center gap-3 sm:justify-end">
        <Button type="submit">{labels.filter}</Button>
        <Link href="/admin/users" className="text-sm underline-offset-4 hover:underline">
          {labels.clear}
        </Link>
      </div>
    </form>
  );
}
