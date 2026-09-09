import type {WaitlistEntry} from "@/db/schema";

export function StaffWaitlistTable({
  entries,
  labels,
}: {
  entries: WaitlistEntry[];
  labels: {
    name: string;
    email: string;
    phone: string;
    course: string;
    created: string;
    empty: string;
  };
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-ink-muted">{labels.empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-ink-subtle">
            <th className="py-3 pr-4 font-medium">{labels.name}</th>
            <th className="py-3 pr-4 font-medium">{labels.email}</th>
            <th className="py-3 pr-4 font-medium">{labels.phone}</th>
            <th className="py-3 pr-4 font-medium">{labels.course}</th>
            <th className="py-3 font-medium">{labels.created}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-line/70 align-top">
              <td className="py-3 pr-4">
                {entry.firstName} {entry.lastName}
              </td>
              <td className="py-3 pr-4">{entry.email}</td>
              <td className="py-3 pr-4">{entry.phone}</td>
              <td className="py-3 pr-4">{entry.courseTitle}</td>
              <td className="py-3 text-ink-muted">
                {entry.createdAt.toISOString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
