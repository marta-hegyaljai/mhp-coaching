import {Panel} from "@/shared/ui/panel";
import {Price} from "@/shared/ui/price";
import {SectionLabel} from "@/shared/ui/section-label";

/** Names the room a reservation screen is acting on, with its published rate. */
export function RoomHeader({
  label,
  roomName,
  rateLabel,
  dateLabel,
}: {
  label: string;
  roomName: string;
  rateLabel: string;
  dateLabel?: string;
}) {
  return (
    <Panel>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
        <h2 className="font-serif text-subheading leading-tight">{roomName}</h2>
        <Price size="sm">{rateLabel}</Price>
      </div>
      {dateLabel ? <p className="mt-3 text-sm leading-6 text-ink">{dateLabel}</p> : null}
    </Panel>
  );
}
