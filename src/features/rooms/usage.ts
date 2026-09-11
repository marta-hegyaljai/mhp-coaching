import type {RoomBooking, RoomBookingBillingOutcome, User} from "@/db/schema";
import {canAccessRooms, canAdminister} from "@/features/auth/policy";
import {billedMinutes, chargeableAmountMinor} from "@/features/rooms/billing";
import {RoomError} from "@/features/rooms/errors";
import {listRoomBookingsStartingInRange} from "@/features/rooms/repository";
import {
  formatLocalDate,
  openZurichMonth,
  zurichMonthRange,
  type ZurichMonth,
} from "@/features/rooms/timezone";

export type UsageLine = {
  bookingId: string;
  userId: string;
  roomId: string;
  roomName: string;
  startsAt: Date;
  endsAt: Date;
  status: RoomBooking["status"];
  billingOutcome: RoomBookingBillingOutcome;
  durationMinutes: number;
  billedMinutes: number;
  billedAmountMinor: number;
  snapshotAmountMinor: number;
  discountPercent: number;
  baseHourlyRateMinor: number;
  effectiveHourlyRateMinor: number;
  currency: "CHF";
};

export type RoomUsageTotal = {
  roomId: string;
  roomName: string;
  billedMinutes: number;
  billedAmountMinor: number;
  bookingCount: number;
};

export type UserUsage = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  currentDiscountPercent: number;
  billedMinutes: number;
  billedAmountMinor: number;
  bookingCount: number;
  rooms: RoomUsageTotal[];
  lines: UsageLine[];
};

export type OpenMonthUsage = {
  year: number;
  month: number;
  monthKey: string;
  start: Date;
  endExclusive: Date;
  open: true;
  billedMinutes: number;
  billedAmountMinor: number;
  bookingCount: number;
  users: UserUsage[];
};

export function projectUsageLine(booking: RoomBooking): UsageLine {
  return {
    bookingId: booking.id,
    userId: booking.userId,
    roomId: booking.roomId,
    roomName: booking.roomName,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    status: booking.status,
    billingOutcome: booking.billingOutcome,
    durationMinutes: booking.durationMinutes,
    billedMinutes: billedMinutes(booking),
    billedAmountMinor: chargeableAmountMinor(booking),
    snapshotAmountMinor: booking.amountMinor,
    discountPercent: booking.discountPercent,
    baseHourlyRateMinor: booking.baseHourlyRateMinor,
    effectiveHourlyRateMinor: booking.effectiveHourlyRateMinor,
    currency: "CHF",
  };
}

function summarizeUser(
  owner: Pick<User, "id" | "firstName" | "lastName" | "email" | "roomDiscountPercent">,
  bookings: RoomBooking[],
): UserUsage {
  const lines = bookings
    .map(projectUsageLine)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime() || a.bookingId.localeCompare(b.bookingId));

  const rooms = new Map<string, RoomUsageTotal>();
  let billedMinuteTotal = 0;
  let billedAmountTotal = 0;

  for (const line of lines) {
    billedMinuteTotal += line.billedMinutes;
    billedAmountTotal += line.billedAmountMinor;
    const existing = rooms.get(line.roomId);
    if (existing) {
      existing.billedMinutes += line.billedMinutes;
      existing.billedAmountMinor += line.billedAmountMinor;
      existing.bookingCount += 1;
    } else {
      rooms.set(line.roomId, {
        roomId: line.roomId,
        roomName: line.roomName,
        billedMinutes: line.billedMinutes,
        billedAmountMinor: line.billedAmountMinor,
        bookingCount: 1,
      });
    }
  }

  return {
    userId: owner.id,
    email: owner.email,
    firstName: owner.firstName,
    lastName: owner.lastName,
    currentDiscountPercent: owner.roomDiscountPercent,
    billedMinutes: billedMinuteTotal,
    billedAmountMinor: billedAmountTotal,
    bookingCount: lines.length,
    rooms: [...rooms.values()].sort((a, b) => a.roomName.localeCompare(b.roomName) || a.roomId.localeCompare(b.roomId)),
    lines,
  };
}

export async function loadOpenMonthUsage(input: {
  actor: User;
  now?: Date;
  userId?: string;
}): Promise<OpenMonthUsage> {
  const month = openZurichMonth(input.now);
  const {start, endExclusive} = zurichMonthRange(month);

  if (input.userId && input.userId !== input.actor.id && !canAdminister(input.actor)) {
    throw new RoomError("forbidden");
  }
  if (!input.userId && !canAdminister(input.actor) && !canAccessRooms(input.actor)) {
    throw new RoomError("forbidden");
  }

  const userId = canAdminister(input.actor) ? input.userId : input.actor.id;
  const rows = await listRoomBookingsStartingInRange({
    from: start,
    toExclusive: endExclusive,
    userId,
  });

  const byUser = new Map<string, {owner: (typeof rows)[number]["owner"]; bookings: RoomBooking[]}>();
  for (const row of rows) {
    const existing = byUser.get(row.owner.id);
    if (existing) {
      existing.bookings.push(row.booking);
    } else {
      byUser.set(row.owner.id, {owner: row.owner, bookings: [row.booking]});
    }
  }

  const users = [...byUser.values()]
    .map(({owner, bookings}) => summarizeUser(owner, bookings))
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName) || a.email.localeCompare(b.email));

  return {
    year: month.year,
    month: month.month,
    monthKey: formatLocalDate(month.year, month.month, 1).slice(0, 7),
    start,
    endExclusive,
    open: true,
    billedMinutes: users.reduce((sum, user) => sum + user.billedMinutes, 0),
    billedAmountMinor: users.reduce((sum, user) => sum + user.billedAmountMinor, 0),
    bookingCount: users.reduce((sum, user) => sum + user.bookingCount, 0),
    users,
  };
}

export async function loadOwnOpenMonthUsage(actor: User, now?: Date): Promise<UserUsage & {month: ZurichMonth; open: true; monthKey: string}> {
  if (!canAccessRooms(actor) && !canAdminister(actor)) {
    throw new RoomError("forbidden");
  }

  const report = await loadOpenMonthUsage({actor, now, userId: actor.id});
  const own = report.users[0] ?? summarizeUser(actor, []);

  return {
    ...own,
    month: {year: report.year, month: report.month},
    monthKey: report.monthKey,
    open: true,
  };
}

export function usageTotalsMatch(report: OpenMonthUsage): boolean {
  const fromUsers = report.users.reduce(
    (sum, user) => ({
      minutes: sum.minutes + user.billedMinutes,
      amount: sum.amount + user.billedAmountMinor,
      count: sum.count + user.bookingCount,
    }),
    {minutes: 0, amount: 0, count: 0},
  );
  const fromLines = report.users.flatMap((user) => user.lines);
  const lineMinutes = fromLines.reduce((sum, line) => sum + line.billedMinutes, 0);
  const lineAmount = fromLines.reduce((sum, line) => sum + line.billedAmountMinor, 0);

  return (
    fromUsers.minutes === report.billedMinutes &&
    fromUsers.amount === report.billedAmountMinor &&
    fromUsers.count === report.bookingCount &&
    lineMinutes === report.billedMinutes &&
    lineAmount === report.billedAmountMinor
  );
}
