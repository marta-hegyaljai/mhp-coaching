import {USER_LIST_ACCESS, USER_LIST_STATUSES, type UserListQuery} from "@/features/admin/user-list-query";
import {localizedPath} from "@/features/seo/metadata";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {FilterBar, type FilterBarFrame} from "@/shared/ui/filter-bar";
import {InputField, SelectField} from "@/shared/ui/field";

export function UserListFilters({
  locale,
  query,
  labels,
  frame = "panel",
}: {
  locale: AppLocale;
  query: UserListQuery;
  frame?: FilterBarFrame;
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
    <FilterBar
      action={localizedPath(locale, "/admin/users")}
      label={labels.filter}
      frame={frame}
      columnsClassName="lg:grid-cols-[minmax(0,1fr)_11rem_11rem_auto]"
      actions={
        <>
          <Button type="submit" variant="secondary">
            {labels.filter}
          </Button>
          <Link href="/admin/users" className="text-sm underline-offset-4 hover:underline">
            {labels.clear}
          </Link>
        </>
      }
    >
      <InputField
        id="user-search"
        name="q"
        type="search"
        size="sm"
        label={labels.search}
        defaultValue={query.q}
        placeholder={labels.searchPlaceholder}
        autoComplete="off"
      />
      <SelectField
        id="user-status"
        name="status"
        size="sm"
        label={labels.status}
        defaultValue={query.status}
      >
        {USER_LIST_STATUSES.map((status) => (
          <option key={status} value={status}>
            {statusLabels[status]}
          </option>
        ))}
      </SelectField>
      <SelectField
        id="user-access"
        name="access"
        size="sm"
        label={labels.access}
        defaultValue={query.access}
      >
        {USER_LIST_ACCESS.map((access) => (
          <option key={access} value={access}>
            {accessLabels[access]}
          </option>
        ))}
      </SelectField>
    </FilterBar>
  );
}
