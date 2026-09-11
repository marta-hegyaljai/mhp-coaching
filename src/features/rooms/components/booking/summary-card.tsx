import type {BookingWhen} from "@/features/rooms/format";
import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";
import {Price} from "@/shared/ui/price";
import {StatusLabel} from "@/shared/ui/status-label";

/**
 * One equal-height card per booking, used by both the therapist and the admin
 * list. The whole surface is the link, and a tonal change on hover is the only
 * motion it carries.
 */
export function BookingSummaryCard({
  href,
  statusLabel,
  cancelled,
  roomName,
  ownerLabel,
  when,
  durationLabel,
  billingLabel,
  amountLabel,
  chargeable,
}: {
  href: PathnameHref;
  statusLabel: string;
  cancelled: boolean;
  roomName: string;
  /** Admin lists identify whose booking it is; therapists already know. */
  ownerLabel?: string;
  when: BookingWhen;
  durationLabel: string;
  billingLabel: string;
  amountLabel: string;
  chargeable: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col rounded-panel border border-ink bg-white p-5 transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <StatusLabel tone={cancelled ? "muted" : "strong"}>{statusLabel}</StatusLabel>
        <Price size="sm" tone={chargeable ? "strong" : "muted"}>
          {amountLabel}
        </Price>
      </div>
      <h3 className="mt-3 font-serif text-[clamp(1.25rem,1.5vw,1.5rem)] leading-[1.15]">
        {roomName}
      </h3>
      {ownerLabel ? (
        <p className="mt-2 text-sm leading-6 text-ink-muted">{ownerLabel}</p>
      ) : null}
      <p className="mt-3 text-sm leading-6 text-ink-muted">{when.dateLabel}</p>
      <p className="mt-1 font-sans text-sm leading-6 tabular-nums text-ink-muted">
        {when.timeLabel} · {durationLabel}
      </p>
      <p className="mt-auto border-t border-line pt-4 text-sm leading-6 text-ink">
        {billingLabel}
      </p>
    </Link>
  );
}
