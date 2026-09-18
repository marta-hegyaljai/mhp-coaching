import type {Booking} from "@/db/schema";
import {
  COURSE_ENROLMENT_STATUSES,
  courseDetailHref,
  type CourseEnrolmentQuery,
} from "@/features/courses/admin-query";
import {
  adminEnrolmentListHref,
  type AdminEnrolmentQuery,
} from "@/features/courses/admin-enrolment-query";
import {enrolmentStatusTone} from "@/features/courses/enrolment-status-labels";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {localizedPath} from "@/features/seo/metadata";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {FilterBar} from "@/shared/ui/filter-bar";
import {InputField, SelectField} from "@/shared/ui/field";
import {formatLongDate} from "@/shared/format/calendar-date";
import type {CourseDate} from "@/features/courses/types";
import {StatusLabel, statusRailClass} from "@/shared/ui/status-label";

export function CourseEnrolmentFilters({
  locale,
  courseId,
  query,
  sessions,
  labels,
}: {
  locale: AppLocale;
  courseId: string;
  query: CourseEnrolmentQuery;
  sessions: CourseDate[];
  labels: {
    search: string;
    searchPlaceholder: string;
    session: string;
    status: string;
    allSessions: string;
    filter: string;
    clear: string;
    statusAll: string;
    statuses: Record<Exclude<(typeof COURSE_ENROLMENT_STATUSES)[number], "all">, string>;
  };
}) {
  return (
    <FilterBar
      action={localizedPath(locale, {
        pathname: "/admin/courses/[id]",
        params: {id: courseId},
      })}
      label={labels.filter}
      columnsClassName="sm:grid-cols-[minmax(0,1fr)_14rem_11rem_auto]"
      actions={
        <>
          <Button type="submit" variant="secondary">
            {labels.filter}
          </Button>
          <Link
            href={courseDetailHref(courseId, {tab: "enrolments"})}
            className="text-sm underline-offset-4 hover:underline"
          >
            {labels.clear}
          </Link>
        </>
      }
    >
      <input type="hidden" name="tab" value="enrolments" />
      <InputField
          id="enrolment-q"
          name="q"
          size="sm"
          label={labels.search}
          defaultValue={query.q}
          placeholder={labels.searchPlaceholder}
        />
      <SelectField
        id="enrolment-session"
        name="session"
        size="sm"
        label={labels.session}
        defaultValue={query.session}
      >
        <option value="">{labels.allSessions}</option>
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {session.startDate}
            {session.endDate ? ` – ${session.endDate}` : ""}
          </option>
        ))}
      </SelectField>
      <SelectField
        id="enrolment-status"
        name="status"
        size="sm"
        label={labels.status}
        defaultValue={query.status}
      >
        {COURSE_ENROLMENT_STATUSES.map((status) => (
          <option key={status} value={status === "all" ? "all" : status}>
            {status === "all" ? labels.statusAll : labels.statuses[status]}
          </option>
        ))}
      </SelectField>
    </FilterBar>
  );
}

export function CatalogueEnrolmentFilters({
  locale,
  query,
  labels,
}: {
  locale: AppLocale;
  query: AdminEnrolmentQuery;
  labels: {
    search: string;
    searchPlaceholder: string;
    showCancelled: string;
    filter: string;
    clear: string;
  };
}) {
  return (
    <FilterBar
      action={localizedPath(locale, "/admin/courses/enrolments")}
      label={labels.filter}
      columnsClassName="sm:grid-cols-[minmax(0,1fr)_auto_auto]"
      actions={
        <>
          <Button type="submit" variant="secondary">
            {labels.filter}
          </Button>
          <Link
            href={adminEnrolmentListHref()}
            className="text-sm underline-offset-4 hover:underline"
          >
            {labels.clear}
          </Link>
        </>
      }
    >
      <InputField
        id="catalogue-enrolment-q"
        name="q"
        type="search"
        size="sm"
        label={labels.search}
        defaultValue={query.q}
        placeholder={labels.searchPlaceholder}
        autoComplete="off"
      />
      <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          name="cancelled"
          value="1"
          defaultChecked={query.showCancelled}
          className="h-4 w-4 rounded-panel border-ink"
        />
        {labels.showCancelled}
      </label>
    </FilterBar>
  );
}

export function CourseEnrolmentTable({
  bookings,
  locale,
  statusLabels,
  labels,
  showCourse = false,
}: {
  bookings: Booking[];
  locale: AppLocale;
  statusLabels: Record<string, string>;
  labels: {
    name: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    address: string;
    session: string;
    amount: string;
    status: string;
    created: string;
    empty: string;
    course?: string;
  };
  showCourse?: boolean;
}) {
  if (bookings.length === 0) {
    return <p className="text-sm text-ink-muted">{labels.empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-ink-subtle">
            <th className="py-3 pr-4 font-medium">{labels.name}</th>
            {showCourse && labels.course ? (
              <th className="py-3 pr-4 font-medium">{labels.course}</th>
            ) : null}
            <th className="py-3 pr-4 font-medium">{labels.dateOfBirth}</th>
            <th className="py-3 pr-4 font-medium">{labels.email}</th>
            <th className="py-3 pr-4 font-medium">{labels.phone}</th>
            <th className="py-3 pr-4 font-medium">{labels.address}</th>
            <th className="py-3 pr-4 font-medium">{labels.session}</th>
            <th className="py-3 pr-4 font-medium">{labels.amount}</th>
            <th className="py-3 pr-4 font-medium">{labels.status}</th>
            <th className="py-3 font-medium">{labels.created}</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr
              key={booking.id}
              className={`border-b border-line/70 align-top ${statusRailClass(enrolmentStatusTone(booking.status))}`}
            >
              <td className="py-3 pr-4">
                {booking.firstName} {booking.lastName}
              </td>
              {showCourse && labels.course ? (
                <td className="py-3 pr-4">
                  <Link
                    href={courseDetailHref(booking.courseId, {tab: "enrolments"})}
                    className="underline-offset-4 hover:underline"
                  >
                    {booking.courseTitle}
                  </Link>
                </td>
              ) : null}
              <td className="py-3 pr-4 font-sans tabular-nums">
                {booking.dateOfBirth
                  ? formatLongDate(booking.dateOfBirth, locale)
                  : "—"}
              </td>
              <td className="py-3 pr-4">{booking.email}</td>
              <td className="py-3 pr-4">{booking.phone}</td>
              <td className="py-3 pr-4">
                {booking.street}
                <div className="text-ink-subtle">
                  {booking.postalCode} {booking.city}
                </div>
                <div className="text-ink-subtle">{booking.country}</div>
              </td>
              <td className="py-3 pr-4 font-sans tabular-nums">
                {booking.courseDateStart}
                {booking.courseDateEnd ? ` – ${booking.courseDateEnd}` : ""}
                <div className="text-ink-subtle">{booking.location}</div>
              </td>
              <td className="py-3 pr-4 font-sans tabular-nums">
                {formatChf(minorUnitsToFrancs(booking.amountMinor), locale)}
              </td>
              <td className="py-3 pr-4">
                <StatusLabel tone={enrolmentStatusTone(booking.status)}>
                  {statusLabels[booking.status] ?? booking.status}
                </StatusLabel>
              </td>
              <td className="py-3 font-sans text-ink-muted tabular-nums">
                {booking.createdAt.toISOString().slice(0, 10)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
