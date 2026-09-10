import type {AdminUserView} from "@/features/admin/user-view";
import {Link} from "@/i18n/navigation";

export function AdminUserTable({
  users,
  labels,
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
}) {
  if (users.length === 0) {
    return <p className="text-sm text-ink-muted">{labels.empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[44rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-ink-subtle">
            <th className="py-3 pr-4 font-medium">{labels.email}</th>
            <th className="py-3 pr-4 font-medium">{labels.name}</th>
            <th className="py-3 pr-4 font-medium">{labels.status}</th>
            <th className="py-3 pr-4 font-medium">{labels.access}</th>
            <th className="py-3 font-medium">
              <span className="sr-only">{labels.manage}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-line/70 align-middle">
              <td className="py-3 pr-4 font-medium whitespace-nowrap">{user.email}</td>
              <td className="py-3 pr-4">
                {user.firstName} {user.lastName}
              </td>
              <td className="py-3 pr-4">
                {user.disabled
                  ? labels.statusDisabled
                  : user.pendingInvite
                    ? labels.statusPending
                    : labels.statusActive}
              </td>
              <td className="py-3 pr-4">{accessLabel(user, labels)}</td>
              <td className="py-3">
                <Link
                  href={{pathname: "/admin/users/[id]", params: {id: user.id}}}
                  className="inline-flex min-h-11 items-center justify-center rounded-panel border border-ink bg-white px-5 text-sm font-semibold text-ink hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
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
