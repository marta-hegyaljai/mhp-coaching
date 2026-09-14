import type {AdminUserView} from "@/features/admin/user-view";
import {Link} from "@/i18n/navigation";

export function AdminUserTable({
  users,
  labels,
  embedded = false,
}: {
  users: AdminUserView[];
  labels: {
    name: string;
    email: string;
    status: string;
    access: string;
    empty: string;
    manage: string;
    statusActive: string;
    statusDisabled: string;
    statusPending: string;
    accessAdmin: string;
    accessRooms: string;
    accessUser: string;
  };
  /** When true, the table sits inside a parent panel that already owns the border. */
  embedded?: boolean;
}) {
  if (users.length === 0) {
    return embedded ? (
      <p className="px-4 py-10 text-center text-sm leading-7 text-ink-muted">{labels.empty}</p>
    ) : (
      <p className="text-sm text-ink-muted">{labels.empty}</p>
    );
  }

  const shellClass = embedded
    ? "overflow-x-auto"
    : "overflow-x-auto rounded-panel border border-ink";

  return (
    <div className={shellClass}>
      <table className="min-w-[44rem] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-ink-subtle">
            <th className="px-4 py-3 font-medium">{labels.email}</th>
            <th className="px-4 py-3 font-medium">{labels.name}</th>
            <th className="px-4 py-3 font-medium">{labels.status}</th>
            <th className="px-4 py-3 font-medium">{labels.access}</th>
            <th className="px-4 py-3 font-medium">
              <span className="sr-only">{labels.manage}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-line-soft last:border-b-0 transition-colors duration-150 ease-standard hover:bg-hover"
            >
              <td className="px-4 py-3 align-top font-medium break-all text-ink">{user.email}</td>
              <td className="px-4 py-3 align-top text-ink">
                {user.firstName} {user.lastName}
              </td>
              <td className="px-4 py-3 align-top text-ink">
                {user.disabled
                  ? labels.statusDisabled
                  : user.pendingInvite
                    ? labels.statusPending
                    : labels.statusActive}
              </td>
              <td className="px-4 py-3 align-top text-ink">{accessLabel(user, labels)}</td>
              <td className="px-4 py-3 align-top">
                <Link
                  href={{pathname: "/admin/users/[id]", params: {id: user.id}}}
                  className="inline-flex min-h-11 items-center justify-center rounded-panel border border-ink bg-white px-5 text-sm font-semibold text-ink transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {labels.manage}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function accessLabel(
  user: AdminUserView,
  labels: {
    accessAdmin: string;
    accessRooms: string;
    accessUser: string;
  },
): string {
  if (user.isAdmin && user.roomBookingEnabled) {
    return `${labels.accessAdmin} · ${labels.accessRooms}`;
  }
  if (user.isAdmin) {
    return labels.accessAdmin;
  }
  if (user.roomBookingEnabled) {
    return labels.accessRooms;
  }
  return labels.accessUser;
}
