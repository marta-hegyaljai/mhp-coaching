"use server";

import {hasLocale} from "next-intl";
import {getTranslations} from "next-intl/server";

import {canAccessRooms, canAdminister} from "@/features/auth/policy";
import {findUserById} from "@/features/auth/repository";
import {readSessionUser} from "@/features/auth/session";
import {
  notifyAdminCreatedRoomBooking,
  notifyAdminMovedRoomBooking,
  notifyAvailabilityRequestCreated,
  notifyAvailabilityRequestDecision,
  notifyRoomBookingCancelled,
  notifyRoomBookingChanged,
  notifyRoomBookingConfirmed,
} from "@/features/rooms/notifications";
import {RoomError} from "@/features/rooms/errors";
import {createRoomBlock, removeRoomBlock} from "@/features/rooms/blocks";
import {
  createAvailabilityRequest,
  resolveAvailabilityRequest,
  withdrawAvailabilityRequest,
} from "@/features/rooms/availability-requests";
import {deleteOwnPrivateNote, saveOwnPrivateNote} from "@/features/rooms/private-notes";
import {reserveRoom} from "@/features/rooms/reservations";
import {
  cancelRoomBooking,
  createRoomBookingForUser,
  moveRoomBooking,
  waiveRoomBooking,
} from "@/features/rooms/lifecycle";
import {
  createRoom,
  editRoom,
  moveRoom,
  parseHourlyRateInput,
  setRoomActive,
} from "@/features/rooms/inventory";
import {saveRoomSettings, type OpeningHourInput} from "@/features/rooms/settings";
import {utcToZurich, formatZurichRange} from "@/features/rooms/timezone";
import {localizedPathname} from "@/i18n/path";
import {revalidateLocalized} from "@/i18n/revalidate";
import {routing, type AppLocale} from "@/i18n/routing";
import {redirect} from "next/navigation";

export type RoomFormState = {
  ok?: boolean;
  error?: string;
  conflicts?: string[];
};

function resolveLocale(locale: string): AppLocale {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

async function requireAdminActor() {
  const actor = await readSessionUser();
  if (!actor || !canAdminister(actor)) {
    throw new RoomError("forbidden");
  }
  return actor;
}

function optionalInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    throw new RoomError("invalidRules");
  }
  return parsed;
}

function requiredInteger(value: string): number {
  const parsed = optionalInteger(value);
  if (parsed === null) {
    throw new RoomError("invalidRules");
  }
  return parsed;
}

async function localizeRoomError(
  error: unknown,
  locale: AppLocale,
): Promise<RoomFormState> {
  const t = await getTranslations({locale, namespace: "Rooms.errors"});
  if (error instanceof RoomError) {
    if (error.code === "blockConflict") {
      return {
        error: t("blockConflict"),
        conflicts: error.conflicts.map((conflict) => {
          const start = utcToZurich(new Date(conflict.startsAt));
          const end = utcToZurich(new Date(conflict.endsAt));
          return `${start.date} ${start.time} – ${end.date} ${end.time}`;
        }),
      };
    }
    return {error: t(error.code)};
  }
  console.error(error);
  return {error: t("saveFailed")};
}

export async function createRoomAction(
  locale: string,
  _previous: RoomFormState | null,
  formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  try {
    const actor = await requireAdminActor();
    await createRoom({
      actor,
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      hourlyRateMinor: parseHourlyRateInput(String(formData.get("hourlyRate") ?? "")),
    });
    revalidateRoomSurfaces();
    return {ok: true};
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
}

export async function updateRoomAction(
  locale: string,
  roomId: string,
  _previous: RoomFormState | null,
  formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  try {
    const actor = await requireAdminActor();
    const intent = String(formData.get("intent") ?? "save");
    if (intent === "disable") {
      await setRoomActive({actor, roomId, active: false});
    } else if (intent === "enable") {
      await setRoomActive({actor, roomId, active: true});
    } else if (intent === "up" || intent === "down") {
      await moveRoom({actor, roomId, direction: intent});
    } else {
      await editRoom({
        actor,
        roomId,
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        hourlyRateMinor: parseHourlyRateInput(String(formData.get("hourlyRate") ?? "")),
      });
    }
    revalidateRoomSurfaces(roomId);
    return {ok: true};
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
}

export async function saveRoomSettingsAction(
  locale: string,
  _previous: RoomFormState | null,
  formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  try {
    const actor = await requireAdminActor();
    const hours: OpeningHourInput[] = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
      weekday,
      closed: formData.get(`closed-${weekday}`) === "on",
      startMinute: Number(formData.get(`start-${weekday}`) ?? 0),
      endMinute: Number(formData.get(`end-${weekday}`) ?? 0),
    }));
    await saveRoomSettings({
      actor,
      cancellationNoticeHours: requiredInteger(
        String(formData.get("cancellationNoticeHours") ?? ""),
      ),
      bookingIntervalMinutes: requiredInteger(
        String(formData.get("bookingIntervalMinutes") ?? ""),
      ),
      minimumBookingMinutes: requiredInteger(
        String(formData.get("minimumBookingMinutes") ?? ""),
      ),
      maximumBookingMinutes: optionalInteger(
        String(formData.get("maximumBookingMinutes") ?? ""),
      ),
      maximumAdvanceBookingDays: optionalInteger(
        String(formData.get("maximumAdvanceBookingDays") ?? ""),
      ),
      reminderNoticeHours: requiredInteger(String(formData.get("reminderNoticeHours") ?? "")),
      hours,
    });
    revalidateRoomSurfaces();
    return {ok: true};
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
}

export async function createBlockAction(
  locale: string,
  roomId: string,
  _previous: RoomFormState | null,
  formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  try {
    const actor = await requireAdminActor();
    await createRoomBlock({
      actor,
      roomId,
      startLocal: readZurichLocal(formData, "start"),
      endLocal: readZurichLocal(formData, "end"),
      reason: String(formData.get("reason") ?? ""),
    });
    revalidateRoomSurfaces(roomId);
    return {ok: true};
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
}

export async function removeBlockAction(
  locale: string,
  roomId: string,
  blockId: string,
): Promise<void> {
  void resolveLocale(locale);
  const actor = await requireAdminActor();
  await removeRoomBlock({actor, blockId});
  revalidateRoomSurfaces(roomId);
}

function readZurichLocal(formData: FormData, prefix: "start" | "end"): string {
  const combined = String(formData.get(`${prefix}Local`) ?? "").trim();
  if (combined) {
    return combined;
  }

  const date = String(formData.get(`${prefix}Date`) ?? "").trim();
  const time = String(formData.get(`${prefix}Time`) ?? "").trim();
  return date && time ? `${date}T${time}` : "";
}

function revalidateRoomSurfaces(roomId?: string, bookingId?: string): void {
  revalidateLocalized("/admin/rooms");
  revalidateLocalized("/admin/settings");
  revalidateLocalized("/admin/bookings");
  revalidateLocalized("/rooms");
  revalidateLocalized("/rooms/book");
  revalidateLocalized("/rooms/bookings");
  revalidateLocalized("/rooms/requests");
  revalidateLocalized("/admin/requests");
  if (roomId) {
    revalidateLocalized({pathname: "/admin/rooms/[id]", params: {id: roomId}});
  }
  if (bookingId) {
    revalidateLocalized({pathname: "/rooms/bookings/[id]", params: {id: bookingId}});
    revalidateLocalized({pathname: "/admin/bookings/[id]", params: {id: bookingId}});
    revalidateLocalized({pathname: "/rooms/bookings/[id]/change", params: {id: bookingId}});
    revalidateLocalized({pathname: "/rooms/bookings/[id]/cancel", params: {id: bookingId}});
  }
}

export async function reserveRoomAction(
  locale: string,
  _previous: RoomFormState | null,
  formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  let bookingId: string;
  let roomId: string;
  try {
    const actor = await readSessionUser();
    if (!actor || !canAccessRooms(actor)) {
      throw new RoomError("forbidden");
    }

    const booking = await reserveRoom({
      actor,
      roomId: String(formData.get("roomId") ?? ""),
      date: String(formData.get("date") ?? ""),
      start: String(formData.get("start") ?? ""),
      end: String(formData.get("end") ?? ""),
      note: String(formData.get("note") ?? ""),
    });
    bookingId = booking.id;
    roomId = booking.roomId;
    await notifyRoomBookingConfirmed({user: actor, booking});
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }

  revalidateRoomSurfaces(roomId, bookingId);
  redirect(`${localizedPathname(resolvedLocale, "/rooms/bookings")}?reserved=1`);
}

async function requireRoomActor() {
  const actor = await readSessionUser();
  if (!actor || !canAccessRooms(actor)) {
    throw new RoomError("forbidden");
  }
  return actor;
}

export async function cancelRoomBookingAction(
  locale: string,
  bookingId: string,
  _previous: RoomFormState | null,
  _formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  try {
    const actor = await requireRoomActor();
    const booking = await cancelRoomBooking({actor, bookingId});
    await notifyRoomBookingCancelled({user: actor, booking});
    revalidateRoomSurfaces(booking.roomId, booking.id);
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
  redirect(`${localizedPathname(resolvedLocale, "/rooms/bookings")}?cancelled=1`);
}

export async function moveRoomBookingAction(
  locale: string,
  bookingId: string,
  _previous: RoomFormState | null,
  formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  let nextPath: string;
  try {
    const actor = await requireRoomActor();
    const result = await moveRoomBooking({
      actor,
      bookingId,
      roomId: String(formData.get("roomId") ?? ""),
      date: String(formData.get("date") ?? ""),
      start: String(formData.get("start") ?? ""),
      end: String(formData.get("end") ?? ""),
    });
    await notifyRoomBookingChanged({user: actor, booking: result.booking});
    revalidateRoomSurfaces(result.booking.roomId, result.booking.id);
    if (result.kind === "replaced") {
      revalidateRoomSurfaces(result.original.roomId, result.original.id);
    }
    nextPath = `${localizedPathname(resolvedLocale, {
      pathname: "/rooms/bookings/[id]",
      params: {id: result.booking.id},
    })}?${result.kind === "replaced" ? "replaced=1" : "moved=1"}`;
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
  redirect(nextPath);
}

/** Same mutations as the booking pages, but stay on the calendar after success. */
export async function reserveRoomOnCalendarAction(
  locale: string,
  _previous: RoomFormState | null,
  formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  try {
    const actor = await requireRoomActor();
    const booking = await reserveRoom({
      actor,
      roomId: String(formData.get("roomId") ?? ""),
      date: String(formData.get("date") ?? ""),
      start: String(formData.get("start") ?? ""),
      end: String(formData.get("end") ?? ""),
      note: String(formData.get("note") ?? ""),
    });
    await notifyRoomBookingConfirmed({user: actor, booking});
    revalidateRoomSurfaces(booking.roomId, booking.id);
    return {ok: true};
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
}

export async function cancelRoomBookingOnCalendarAction(
  locale: string,
  bookingId: string,
  _previous: RoomFormState | null,
  _formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  try {
    const actor = await requireRoomActor();
    const booking = await cancelRoomBooking({actor, bookingId});
    await notifyRoomBookingCancelled({user: actor, booking});
    revalidateRoomSurfaces(booking.roomId, booking.id);
    return {ok: true};
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
}

export async function moveRoomBookingOnCalendarAction(
  locale: string,
  bookingId: string,
  _previous: RoomFormState | null,
  formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  try {
    const actor = await requireRoomActor();
    const result = await moveRoomBooking({
      actor,
      bookingId,
      roomId: String(formData.get("roomId") ?? ""),
      date: String(formData.get("date") ?? ""),
      start: String(formData.get("start") ?? ""),
      end: String(formData.get("end") ?? ""),
    });
    await notifyRoomBookingChanged({user: actor, booking: result.booking});
    revalidateRoomSurfaces(result.booking.roomId, result.booking.id);
    if (result.kind === "replaced") {
      revalidateRoomSurfaces(result.original.roomId, result.original.id);
    }
    return {ok: true};
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
}

export async function adminCreateRoomBookingAction(
  locale: string,
  _previous: RoomFormState | null,
  formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  let nextPath: string;
  try {
    const actor = await requireAdminActor();
    const booking = await createRoomBookingForUser({
      actor,
      userId: String(formData.get("userId") ?? ""),
      roomId: String(formData.get("roomId") ?? ""),
      date: String(formData.get("date") ?? ""),
      start: String(formData.get("start") ?? ""),
      end: String(formData.get("end") ?? ""),
    });
    const user = await findUserById(booking.userId);
    if (user) {
      await notifyAdminCreatedRoomBooking({user, booking});
    }
    revalidateRoomSurfaces(booking.roomId, booking.id);
    nextPath = `${localizedPathname(resolvedLocale, {
      pathname: "/admin/bookings/[id]",
      params: {id: booking.id},
    })}?created=1`;
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
  redirect(nextPath);
}

export async function adminMoveRoomBookingAction(
  locale: string,
  bookingId: string,
  _previous: RoomFormState | null,
  formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  let nextPath: string;
  try {
    const actor = await requireAdminActor();
    const result = await moveRoomBooking({
      actor,
      bookingId,
      roomId: String(formData.get("roomId") ?? ""),
      date: String(formData.get("date") ?? ""),
      start: String(formData.get("start") ?? ""),
      end: String(formData.get("end") ?? ""),
    });
    const user = await findUserById(result.booking.userId);
    if (user) {
      await notifyAdminMovedRoomBooking({user, booking: result.booking});
    }
    revalidateRoomSurfaces(result.booking.roomId, result.booking.id);
    nextPath = `${localizedPathname(resolvedLocale, {
      pathname: "/admin/bookings/[id]",
      params: {id: result.booking.id},
    })}?moved=1`;
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
  redirect(nextPath);
}

export async function adminCancelRoomBookingAction(
  locale: string,
  bookingId: string,
  _previous: RoomFormState | null,
  _formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  let nextPath: string;
  try {
    const actor = await requireAdminActor();
    const booking = await cancelRoomBooking({actor, bookingId});
    const owner = await findUserById(booking.userId);
    if (owner) {
      await notifyRoomBookingCancelled({user: owner, booking});
    }
    revalidateRoomSurfaces(booking.roomId, booking.id);
    nextPath = `${localizedPathname(resolvedLocale, {
      pathname: "/admin/bookings/[id]",
      params: {id: booking.id},
    })}?cancelled=1`;
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
  redirect(nextPath);
}

export async function adminWaiveRoomBookingAction(
  locale: string,
  bookingId: string,
  _previous: RoomFormState | null,
  _formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  let nextPath: string;
  try {
    const actor = await requireAdminActor();
    const booking = await waiveRoomBooking({actor, bookingId});
    revalidateRoomSurfaces(booking.roomId, booking.id);
    nextPath = `${localizedPathname(resolvedLocale, {
      pathname: "/admin/bookings/[id]",
      params: {id: booking.id},
    })}?waived=1`;
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
  redirect(nextPath);
}

function revalidateRequestSurfaces(requestId?: string): void {
  revalidateLocalized("/rooms/requests");
  revalidateLocalized("/rooms/requests/new");
  revalidateLocalized("/admin/requests");
  if (requestId) {
    revalidateLocalized({pathname: "/rooms/requests/[id]", params: {id: requestId}});
    revalidateLocalized({pathname: "/admin/requests/[id]", params: {id: requestId}});
  }
}

export async function savePrivateNoteAction(
  locale: string,
  bookingId: string,
  _previous: RoomFormState | null,
  formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  try {
    const actor = await requireRoomActor();
    const intent = String(formData.get("intent") ?? "save");
    if (intent === "delete") {
      await deleteOwnPrivateNote(actor, bookingId);
    } else {
      await saveOwnPrivateNote(actor, bookingId, String(formData.get("note") ?? ""));
    }
    revalidateRoomSurfaces(undefined, bookingId);
    return {ok: true};
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
}

export async function createAvailabilityRequestAction(
  locale: string,
  _previous: RoomFormState | null,
  formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  let requestId: string;
  try {
    const actor = await requireRoomActor();
    const preferredRoom = String(formData.get("preferredRoomId") ?? "").trim();
    const request = await createAvailabilityRequest({
      actor,
      date: String(formData.get("date") ?? ""),
      start: String(formData.get("start") ?? ""),
      end: String(formData.get("end") ?? ""),
      preferredRoomId: preferredRoom && preferredRoom !== "any" ? preferredRoom : undefined,
      message: String(formData.get("message") ?? ""),
    });
    requestId = request.id;
    await notifyAvailabilityRequestCreated({
      user: actor,
      requestId: request.id,
      time: formatZurichRange(new Date(request.startsAt), new Date(request.endsAt)),
      roomName: request.preferredRoomName,
    });
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
  revalidateRequestSurfaces(requestId);
  redirect(`${localizedPathname(resolvedLocale, "/rooms/requests")}?submitted=1`);
}

export async function withdrawAvailabilityRequestAction(
  locale: string,
  requestId: string,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  try {
    const actor = await requireRoomActor();
    await withdrawAvailabilityRequest(actor, requestId);
    revalidateRequestSurfaces(requestId);
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
  redirect(`${localizedPathname(resolvedLocale, "/rooms/requests")}?withdrawn=1`);
}

export async function resolveAvailabilityRequestAction(
  locale: string,
  requestId: string,
  _previous: RoomFormState | null,
  formData: FormData,
): Promise<RoomFormState> {
  const resolvedLocale = resolveLocale(locale);
  const decisionRaw = String(formData.get("decision") ?? "");
  if (decisionRaw !== "RESOLVED" && decisionRaw !== "DECLINED") {
    return localizeRoomError(new RoomError("invalidRules"), resolvedLocale);
  }
  let nextPath: string;
  try {
    const actor = await requireAdminActor();
    const request = await resolveAvailabilityRequest({
      actor,
      requestId,
      decision: decisionRaw,
      adminNote: String(formData.get("adminNote") ?? ""),
    });
    const owner = await findUserById(request.owner.id);
    if (owner) {
      await notifyAvailabilityRequestDecision({
        user: owner,
        requestId: request.id,
        decision: decisionRaw,
        time: formatZurichRange(new Date(request.startsAt), new Date(request.endsAt)),
        roomName: request.preferredRoomName,
      });
    }
    revalidateRequestSurfaces(request.id);
    nextPath = `${localizedPathname(resolvedLocale, {
      pathname: "/admin/requests/[id]",
      params: {id: request.id},
    })}?${request.status === "RESOLVED" ? "resolved=1" : "declined=1"}`;
  } catch (error) {
    return localizeRoomError(error, resolvedLocale);
  }
  redirect(nextPath);
}
