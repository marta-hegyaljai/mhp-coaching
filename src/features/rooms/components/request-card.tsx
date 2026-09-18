import type {TherapistRequest} from "@/features/rooms/availability-requests";
import {bookingWhen} from "@/features/rooms/format";
import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {StatusLabel, statusRailClass, type StatusTone} from "@/shared/ui/status-label";

export function RequestCard({
  request,
  locale,
  href,
  statusLabel,
  roomLabel,
  ownerLabel,
}: {
  request: Pick<TherapistRequest, "startsAt" | "endsAt" | "status">;
  locale: AppLocale;
  href: PathnameHref;
  statusLabel: string;
  roomLabel: string;
  ownerLabel?: string;
}) {
  const when = bookingWhen(new Date(request.startsAt), new Date(request.endsAt), locale);
  const tone = requestStatusTone(request.status);

  return (
    <Link
      href={href}
      className={`flex h-full flex-col rounded-panel border border-ink bg-white p-5 transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${statusRailClass(tone)}`}
    >
      <StatusLabel tone={tone}>
        {statusLabel}
      </StatusLabel>
      <h3 className="mt-3 font-serif text-[clamp(1.25rem,1.5vw,1.5rem)] leading-[1.15]">
        {roomLabel}
      </h3>
      {ownerLabel ? (
        <p className="mt-2 text-sm leading-6 text-ink-muted">{ownerLabel}</p>
      ) : null}
      <p className="mt-3 text-sm leading-6 text-ink-muted">{when.dateLabel}</p>
      <p className="mt-1 font-sans text-sm leading-6 tabular-nums text-ink-muted">
        {when.timeLabel}
      </p>
    </Link>
  );
}

function requestStatusTone(status: TherapistRequest["status"]): StatusTone {
  if (status === "OPEN") {
    return "gold";
  }
  if (status === "DECLINED") {
    return "stop";
  }
  return "ok";
}
