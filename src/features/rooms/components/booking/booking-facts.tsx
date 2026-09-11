import type {BookingWhen} from "@/features/rooms/format";

/**
 * Room, day, time and duration in one fixed order. Every booking screen
 * repeats the same four lines so the eye lands in the same place.
 */
export function BookingFacts({
  roomName,
  when,
  durationLabel,
  ownerLabel,
  headingLevel = "h2",
  headingId,
}: {
  roomName: string;
  when: BookingWhen;
  durationLabel: string;
  /** Shown on admin screens, which act on somebody else's booking. */
  ownerLabel?: string;
  headingLevel?: "h1" | "h2" | "h3";
  headingId?: string;
}) {
  const Heading = headingLevel;

  return (
    <div>
      <Heading id={headingId} className="font-serif text-subheading leading-tight">
        {roomName}
      </Heading>
      {ownerLabel ? (
        <p className="mt-2 text-sm leading-6 text-ink-muted">{ownerLabel}</p>
      ) : null}
      <p className="mt-3 text-sm leading-6 text-ink">{when.dateLabel}</p>
      <p className="mt-1 font-sans text-sm leading-6 tabular-nums text-ink">
        {when.timeLabel} · {durationLabel}
      </p>
    </div>
  );
}
