"use client";

import type {ReactNode} from "react";
import {useTranslations} from "next-intl";

import {Button} from "@/shared/ui/button";
import {DateField} from "@/shared/ui/date-field";
import {SelectField} from "@/shared/ui/field";
import {Panel} from "@/shared/ui/panel";
import {SectionLabel} from "@/shared/ui/section-label";

export type NavigatorRoom = {
  id: string;
  name: string;
};

/**
 * Room and date decide which slots exist, so they round-trip to the server
 * instead of being guessed in the browser. It renders outside the confirm
 * form so a day with no free slot is still navigable.
 */
export function SlotNavigator({
  action,
  label,
  rooms,
  roomId,
  date,
  children,
}: {
  action: string;
  label: string;
  rooms: NavigatorRoom[];
  roomId?: string;
  date?: string;
  /** Extra scoping controls, such as the therapist on the admin screen. */
  children?: ReactNode;
}) {
  const t = useTranslations("Rooms");

  return (
    <Panel>
      <SectionLabel>{label}</SectionLabel>
      <form
        method="get"
        action={action}
        // Changing a control re-queries availability; the submit button keeps
        // the form usable when that change event never reaches the browser.
        onChange={(event) => event.currentTarget.requestSubmit()}
        className="mt-4 grid gap-4 sm:grid-cols-2"
      >
        {children}
        <SelectField
          id="slot-room"
          name="room"
          label={t("bookRoom")}
          defaultValue={roomId}
          disabled={rooms.length <= 1}
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </SelectField>
        <DateField
          id="slot-date"
          name="date"
          label={t("bookDate")}
          defaultValue={date}
        />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:col-span-2">
          <Button type="submit" variant="secondary">
            {t("showTimes")}
          </Button>
          <p className="text-sm leading-6 text-ink-muted">{t("timezoneNote")}</p>
        </div>
      </form>
    </Panel>
  );
}
