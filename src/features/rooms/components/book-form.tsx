"use client";

import {useActionState, useState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert} from "@/features/auth/components/auth-field";
import {reserveRoomAction} from "@/features/rooms/actions";
import {
  pickPreferredRoomId,
  writeLastRoomPreference,
} from "@/features/rooms/components/availability/last-room-preference";
import {AmountSummary} from "@/features/rooms/components/booking/amount-summary";
import {RoomHeader} from "@/features/rooms/components/booking/room-header";
import {SlotFields} from "@/features/rooms/components/booking/slot-fields";
import {useSlotSelection} from "@/features/rooms/components/booking/use-slot-selection";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {ReservationPreview} from "@/features/rooms/reservations";
import type {AppLocale} from "@/i18n/routing";
import {NoticePanel} from "@/features/rooms/components/booking/notice-panel";
import {PRIVATE_NOTE_MAX_LENGTH} from "@/features/rooms/limits";
import {Panel, PanelDivider} from "@/shared/ui/panel";
import {SelectField, TextareaField} from "@/shared/ui/field";
import {SubmitButton} from "@/shared/ui/submit-button";

export function RoomBookForm({
  locale,
  previews,
  dateLabel,
}: {
  locale: AppLocale;
  previews: ReservationPreview[];
  dateLabel: string;
}) {
  const t = useTranslations("Rooms");
  const availableRoomIds = previews.map((preview) => preview.room.id);
  const [roomId, setRoomId] = useState(
    () => pickPreferredRoomId(availableRoomIds) ?? previews[0].room.id,
  );
  const preview = previews.find((candidate) => candidate.room.id === roomId) ?? previews[0];
  const selection = useSlotSelection(preview);
  const [state, action, pending] = useActionState(
    reserveRoomAction.bind(null, locale),
    null,
  );
  const quote = selection.quote ?? preview.quote;

  return (
    <form
      action={action}
      className="space-y-6"
      onSubmit={() => writeLastRoomPreference(roomId)}
    >
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}

      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="date" value={preview.date} />

      {previews.length > 1 ? (
        <Panel>
          <SelectField
            id="booking-room"
            label={t("chooseAvailableRoom")}
            help={t("chooseAvailableRoomHelp", {count: previews.length})}
            value={roomId}
            onChange={(event) => {
              const nextRoomId = event.target.value;
              setRoomId(nextRoomId);
              writeLastRoomPreference(nextRoomId);
            }}
          >
            {previews.map((candidate) => (
              <option key={candidate.room.id} value={candidate.room.id}>
                {candidate.room.name} · {formatChf(
                  minorUnitsToFrancs(candidate.room.hourlyRateMinor),
                  locale,
                )}
                {t("perHour")}
              </option>
            ))}
          </SelectField>
          <p className="mt-4 text-sm leading-6 text-ink">{dateLabel}</p>
        </Panel>
      ) : (
        <RoomHeader
          label={t("bookRoom")}
          roomName={preview.room.name}
          rateLabel={`${formatChf(minorUnitsToFrancs(preview.room.hourlyRateMinor), locale)}${t("perHour")}`}
          dateLabel={dateLabel}
        />
      )}

      <Panel>
        <SlotFields starts={preview.starts} selection={selection} />
        <PanelDivider className="mt-6" />
        <div className="mt-6">
          <AmountSummary
            locale={locale}
            durationMinutes={quote.durationMinutes}
            rateMinor={preview.room.hourlyRateMinor}
            amountMinor={quote.amountMinor}
            discountPercent={quote.discountPercent}
            showBillingNote
          />
        </div>
      </Panel>

      <NoticePanel label={t("privateNote")} message={t("privateNoteWarning")} />
      <Panel>
        <TextareaField
          id="booking-note"
          name="note"
          label={t("privateNote")}
          help={t("privateNoteHelp")}
          maxLength={PRIVATE_NOTE_MAX_LENGTH}
          autoComplete="off"
          spellCheck={false}
        />
      </Panel>

      <SubmitButton
        pending={pending}
        disabled={!selection.ready}
        label={t("confirmBooking")}
        pendingLabel={t("confirming")}
      />
    </form>
  );
}
