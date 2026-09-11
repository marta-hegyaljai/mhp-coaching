import {and, eq} from "drizzle-orm";

import {getDb} from "@/db";
import {roomBookingPrivateNotes, type User} from "@/db/schema";
import {canAccessRooms} from "@/features/auth/policy";
import {RoomError} from "@/features/rooms/errors";
import {PRIVATE_NOTE_MAX_LENGTH} from "@/features/rooms/limits";
import {decryptNote, encryptNote} from "@/features/rooms/note-crypto";
import {findBookingById} from "@/features/rooms/repository";
import {sanitizeVisibleText} from "@/features/rooms/visible-text";
import {isUuid} from "@/lib/uuid";

export type OwnerPrivateNote = {
  bookingId: string;
  text: string;
  updatedAt: string;
};

function requireTherapist(actor: User): void {
  if (!canAccessRooms(actor)) {
    throw new RoomError("forbidden");
  }
}

export function parsePrivateNoteInput(value: string): string {
  return sanitizeVisibleText(value, PRIVATE_NOTE_MAX_LENGTH, "invalidNote", {
    allowEmpty: true,
  });
}

async function requireOwnedBooking(actor: User, bookingId: string) {
  requireTherapist(actor);
  if (!isUuid(bookingId)) {
    throw new RoomError("notFound");
  }
  const booking = await findBookingById(bookingId);
  if (!booking || booking.userId !== actor.id) {
    throw new RoomError("notFound");
  }
  return booking;
}

async function loadEncryptedNote(bookingId: string, ownerUserId: string) {
  const [row] = await getDb()
    .select({
      ciphertext: roomBookingPrivateNotes.ciphertext,
      nonce: roomBookingPrivateNotes.nonce,
      keyVersion: roomBookingPrivateNotes.keyVersion,
      updatedAt: roomBookingPrivateNotes.updatedAt,
    })
    .from(roomBookingPrivateNotes)
    .where(
      and(
        eq(roomBookingPrivateNotes.bookingId, bookingId),
        eq(roomBookingPrivateNotes.ownerUserId, ownerUserId),
      ),
    )
    .limit(1);
  return row;
}

export async function getOwnPrivateNote(
  actor: User,
  bookingId: string,
): Promise<OwnerPrivateNote | null> {
  const booking = await requireOwnedBooking(actor, bookingId);
  const row = await loadEncryptedNote(booking.id, actor.id);
  if (!row) {
    return null;
  }
  return {
    bookingId: booking.id,
    text: decryptNote(row),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function saveOwnPrivateNote(
  actor: User,
  bookingId: string,
  rawText: string,
): Promise<OwnerPrivateNote | null> {
  const booking = await requireOwnedBooking(actor, bookingId);
  const text = parsePrivateNoteInput(rawText);
  if (!text) {
    await deleteOwnPrivateNote(actor, booking.id);
    return null;
  }

  const encrypted = encryptNote(text);
  const now = new Date();
  const [row] = await getDb()
    .insert(roomBookingPrivateNotes)
    .values({
      bookingId: booking.id,
      ownerUserId: actor.id,
      ciphertext: encrypted.ciphertext,
      nonce: encrypted.nonce,
      keyVersion: encrypted.keyVersion,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: roomBookingPrivateNotes.bookingId,
      set: {
        ownerUserId: actor.id,
        ciphertext: encrypted.ciphertext,
        nonce: encrypted.nonce,
        keyVersion: encrypted.keyVersion,
        updatedAt: now,
      },
    })
    .returning({updatedAt: roomBookingPrivateNotes.updatedAt});

  return {
    bookingId: booking.id,
    text,
    updatedAt: (row?.updatedAt ?? now).toISOString(),
  };
}

export async function deleteOwnPrivateNote(actor: User, bookingId: string): Promise<void> {
  const booking = await requireOwnedBooking(actor, bookingId);
  await getDb()
    .delete(roomBookingPrivateNotes)
    .where(
      and(
        eq(roomBookingPrivateNotes.bookingId, booking.id),
        eq(roomBookingPrivateNotes.ownerUserId, actor.id),
      ),
    );
}
