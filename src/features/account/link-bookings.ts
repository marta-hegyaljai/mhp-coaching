import {and, eq, isNull} from "drizzle-orm";

import type {User} from "@/db/schema";
import {getDb} from "@/db";
import {bookings} from "@/db/schema";

export async function linkUnownedBookingsForVerifiedUser(
  user: Pick<User, "id" | "emailNormalized" | "emailVerifiedAt" | "disabledAt">,
): Promise<number> {
  if (!user.emailVerifiedAt || user.disabledAt) {
    return 0;
  }

  const linked = await getDb()
    .update(bookings)
    .set({
      userId: user.id,
      updatedAt: new Date(),
    })
    .where(
      and(
        isNull(bookings.userId),
        eq(bookings.emailNormalized, user.emailNormalized),
      ),
    )
    .returning({id: bookings.id});

  return linked.length;
}
