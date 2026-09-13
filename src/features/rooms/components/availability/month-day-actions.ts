"use server";

import {canAccessRooms} from "@/features/auth/policy";
import {readSessionUser} from "@/features/auth/session";
import {
  therapistAvailability,
  type AvailabilityRoom,
} from "@/features/rooms/availability";
import {RoomError} from "@/features/rooms/errors";
import {parseLocalDate} from "@/features/rooms/timezone";

import type {MonthDaySlot} from "./month-day-slots";

export type MonthDayGrid = {
  date: string;
  intervalMinutes: number;
  minimumBookingMinutes: number;
  maximumBookingMinutes: number | null;
  rooms: AvailabilityRoom[];
  slots: MonthDaySlot[];
};

export async function loadMonthDayGridAction(input: {
  date: string;
  roomIds: string[];
}): Promise<MonthDayGrid | {error: true}> {
  try {
    parseLocalDate(input.date);
    const actor = await readSessionUser();
    if (!actor || !canAccessRooms(actor)) {
      return {error: true};
    }

    const availability = await therapistAvailability({
      actor,
      view: "day",
      date: input.date,
      roomIds: input.roomIds,
    });

    return {
      date: input.date,
      intervalMinutes: availability.intervalMinutes,
      minimumBookingMinutes: availability.minimumBookingMinutes,
      maximumBookingMinutes: availability.maximumBookingMinutes,
      rooms: availability.rooms.filter((room) =>
        input.roomIds.length > 0 ? input.roomIds.includes(room.id) : room.active,
      ),
      slots: availability.slots.map((slot) => ({
        roomId: slot.roomId,
        localStart: slot.localStart,
        localEnd: slot.localEnd,
        state: slot.state,
        ...(slot.ownBookingId ? {ownBookingId: slot.ownBookingId} : {}),
      })),
    };
  } catch (error) {
    if (error instanceof RoomError || error instanceof Error) {
      return {error: true};
    }
    return {error: true};
  }
}
