import type {User} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAdminister} from "@/features/auth/policy";
import {accessSnapshot, findUserById, recordAudit, updateUser} from "@/features/auth/repository";
import {RoomError} from "@/features/rooms/errors";
import {normalizeDiscountPercent} from "@/features/rooms/pricing";

export async function setUserRoomDiscount(input: {
  actor: User;
  targetUserId: string;
  discountPercent: number;
}): Promise<User> {
  if (!canAdminister(input.actor)) {
    throw new RoomError("forbidden");
  }

  let discountPercent: number;
  try {
    discountPercent = normalizeDiscountPercent(input.discountPercent);
  } catch {
    throw new RoomError("invalidDiscount");
  }

  const target = await findUserById(input.targetUserId);
  if (!target) {
    throw new RoomError("notFound");
  }

  if (target.roomDiscountPercent === discountPercent) {
    return target;
  }

  const before = accessSnapshot(target);
  const updated = await updateUser(target.id, {roomDiscountPercent: discountPercent});

  await recordAudit({
    actorUserId: input.actor.id,
    targetUserId: target.id,
    action: AUDIT_ACTIONS.ROOM_DISCOUNT_CHANGED,
    before: {...before, discountPercent: target.roomDiscountPercent},
    after: {...accessSnapshot(updated), discountPercent: updated.roomDiscountPercent},
  });

  return updated;
}
