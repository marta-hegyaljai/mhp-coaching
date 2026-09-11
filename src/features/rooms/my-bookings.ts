import type {RoomBooking, User} from "@/db/schema";
import {canAccessRooms} from "@/features/auth/policy";
import {RoomError} from "@/features/rooms/errors";
import {findOwnBooking, listOwnBookings} from "@/features/rooms/repository";
import {isUuid} from "@/lib/uuid";

export type OwnBookingLists = {
  upcoming: RoomBooking[];
  history: RoomBooking[];
};

function requireTherapist(actor: User): void {
  if (!canAccessRooms(actor)) {
    throw new RoomError("forbidden");
  }
}

export function splitOwnBookings(
  bookings: RoomBooking[],
  now = new Date(),
): OwnBookingLists {
  const upcoming: RoomBooking[] = [];
  const history: RoomBooking[] = [];

  for (const booking of bookings) {
    if (booking.status === "CONFIRMED" && booking.endsAt.getTime() > now.getTime()) {
      upcoming.push(booking);
    } else {
      history.push(booking);
    }
  }

  upcoming.sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
  history.sort((left, right) => right.startsAt.getTime() - left.startsAt.getTime());
  return {upcoming, history};
}

export async function listMyRoomBookings(
  actor: User,
  now = new Date(),
): Promise<OwnBookingLists> {
  requireTherapist(actor);
  return splitOwnBookings(await listOwnBookings(actor.id), now);
}

export async function getMyRoomBooking(actor: User, bookingId: string): Promise<RoomBooking> {
  requireTherapist(actor);
  if (!isUuid(bookingId)) {
    throw new RoomError("notFound");
  }
  const booking = await findOwnBooking(actor.id, bookingId);
  if (!booking) {
    throw new RoomError("notFound");
  }
  return booking;
}

export function assertOwnBookingPrivacy(value: unknown): void {
  const encoded = JSON.stringify(value);
  for (const key of ["email", "firstName", "lastName", "note", "notes", "password", "passwordHash"]) {
    if (encoded.includes(`"${key}"`)) {
      throw new Error(`Own booking payload leaked ${key}`);
    }
  }
}
