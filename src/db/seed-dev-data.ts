import {randomBytes, scrypt as scryptCallback, type ScryptOptions} from "node:crypto";
import {config} from "dotenv";

import {and, eq} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {bookings, type User} from "@/db/schema";
import {createPendingBooking, markBookingPaidOnce} from "@/features/bookings/repository";
import {courses as seedCourses} from "@/features/courses/catalog";
import {upsertSeedCatalogue} from "@/features/courses/repository";
import {normalizeEmail} from "@/features/auth/email";
import {
  findUserByNormalizedEmail,
  insertUser,
  updateUser,
} from "@/features/auth/repository";
import {RoomError} from "@/features/rooms/errors";
import {createRoom} from "@/features/rooms/inventory";
import {listRooms} from "@/features/rooms/repository";
import {cancelRoomBooking} from "@/features/rooms/lifecycle";
import {reserveRoom} from "@/features/rooms/reservations";
import {saveRoomSettings} from "@/features/rooms/settings";
import {francsToMinorUnits} from "@/features/payments/money";

config({path: ".env.local"});
config();

const DEV_PASSWORD = "abc123";

const DEFAULT_OPENING_HOURS = [
  {weekday: 1, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
  {weekday: 2, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
  {weekday: 3, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
  {weekday: 4, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
  {weekday: 5, closed: false, startMinute: 7 * 60, endMinute: 21 * 60},
  {weekday: 6, closed: false, startMinute: 8 * 60, endMinute: 18 * 60},
  {weekday: 7, closed: true, startMinute: 0, endMinute: 0},
];

function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (error, derived) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derived);
    });
  });
}

/** Local dev only — stores short passwords using the same format as production. */
async function hashDevPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, {
    N: 16_384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });

  return [
    "scrypt",
    "16384",
    "8",
    "1",
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

type DevUserSpec = {
  email: string;
  firstName: string;
  lastName: string;
  locale: "fr" | "de" | "en";
  isAdmin?: boolean;
  roomBookingEnabled?: boolean;
  roomDiscountPercent?: number;
};

async function upsertDevUser(spec: DevUserSpec): Promise<User> {
  const emailNormalized = normalizeEmail(spec.email);
  const passwordHash = await hashDevPassword(DEV_PASSWORD);
  const existing = await findUserByNormalizedEmail(emailNormalized);

  const values = {
    email: spec.email.trim(),
    emailNormalized,
    firstName: spec.firstName,
    lastName: spec.lastName,
    locale: spec.locale,
    isAdmin: spec.isAdmin ?? false,
    roomBookingEnabled: spec.roomBookingEnabled ?? false,
    roomDiscountPercent: spec.roomDiscountPercent ?? 0,
    passwordHash,
    emailVerifiedAt: new Date(),
    disabledAt: null,
  };

  if (existing) {
    return updateUser(existing.id, values);
  }

  const created = await insertUser(values);
  if ((spec.roomDiscountPercent ?? 0) > 0) {
    return updateUser(created.id, {
      roomDiscountPercent: spec.roomDiscountPercent,
    });
  }

  return created;
}

async function ensureRoomInfrastructure(admin: User) {
  await saveRoomSettings({
    actor: admin,
    cancellationNoticeHours: 48,
    bookingIntervalMinutes: 30,
    minimumBookingMinutes: 60,
    maximumBookingMinutes: null,
    maximumAdvanceBookingDays: null,
    reminderNoticeHours: 24,
    hours: DEFAULT_OPENING_HOURS,
  });

  const existing = await listRooms();
  if (existing.length >= 2) {
    return existing;
  }

  const names = ["Cabinet A", "Cabinet B", "Cabinet C"];
  for (const name of names) {
    if (existing.some((room) => room.name === name)) {
      continue;
    }
    await createRoom({
      actor: admin,
      name,
      description: `Local dev room — ${name}`,
      hourlyRateMinor: francsToMinorUnits(40),
    });
  }

  // createRoom only returns the new id, so re-read the full rows.
  return listRooms();
}

async function seedCourseBookings(users: User[]) {
  const privacyAcceptedAt = new Date();
  const course = seedCourses.find((item) => item.id === "omni-practitioner");
  const advanced = seedCourses.find((item) => item.id === "advanced-techniques");
  const sport = seedCourses.find((item) => item.id === "sport-hypnosis");

  if (!course?.dates[0] || !advanced?.dates[0] || !sport?.dates[0]) {
    throw new Error("Expected seeded course sessions are missing.");
  }

  const scenarios: Array<{
    user?: User;
    guest?: {firstName: string; lastName: string; email: string};
    course: typeof course;
    sessionIndex: number;
    status: "PAID" | "PENDING" | "LEAD";
    locale: "fr" | "de" | "en";
  }> = [
    {
      user: users.find((item) => item.emailNormalized.includes("student")),
      course,
      sessionIndex: 0,
      status: "PAID",
      locale: "en",
    },
    {
      user: users.find((item) => item.emailNormalized.includes("therapist")),
      course: advanced,
      sessionIndex: 0,
      status: "PAID",
      locale: "fr",
    },
    {
      user: users.find((item) => item.emailNormalized.includes("marie.dubois")),
      course,
      sessionIndex: 1,
      status: "PAID",
      locale: "fr",
    },
    {
      user: users.find((item) => item.emailNormalized.includes("hans.mueller")),
      course: sport,
      sessionIndex: 0,
      status: "PENDING",
      locale: "de",
    },
    {
      user: users.find((item) => item.emailNormalized.includes("emma.wilson")),
      course,
      sessionIndex: 2,
      status: "LEAD",
      locale: "en",
    },
    {
      guest: {
        firstName: "Guest",
        lastName: "Checkout",
        email: "guest.checkout@example.test",
      },
      course: advanced,
      sessionIndex: 0,
      status: "PAID",
      locale: "fr",
    },
    {
      guest: {
        firstName: "Pending",
        lastName: "Guest",
        email: "pending.guest@example.test",
      },
      course: sport,
      sessionIndex: 0,
      status: "PENDING",
      locale: "de",
    },
  ];

  let created = 0;

  for (const scenario of scenarios) {
    const session = scenario.course.dates[scenario.sessionIndex];
    if (!session) {
      continue;
    }

    const email = scenario.user?.email ?? scenario.guest!.email;
    const emailNormalized = normalizeEmail(email);
    const firstName = scenario.user?.firstName ?? scenario.guest!.firstName;
    const lastName = scenario.user?.lastName ?? scenario.guest!.lastName;

    const [existingBooking] = await getDb()
      .select({id: bookings.id})
      .from(bookings)
      .where(
        and(
          eq(bookings.emailNormalized, emailNormalized),
          eq(bookings.courseDateId, session.id),
        ),
      )
      .limit(1);

    if (existingBooking) {
      continue;
    }

    const booking = await createPendingBooking({
      firstName,
      lastName,
      email,
      phone: "+41 26 123 45 67",
      street: "Rue de Lausanne 12",
      postalCode: "1700",
      city: "Fribourg",
      country: "CH",
      locale: scenario.locale,
      courseId: scenario.course.id,
      courseDateId: session.id,
      courseTitle: scenario.course.title[scenario.locale],
      courseDateStart: session.startDate,
      courseDateEnd: session.endDate,
      location: session.location[scenario.locale],
      amountMinor: francsToMinorUnits(scenario.course.priceChf),
      currency: "CHF",
      paymentProvider: "fake",
      privacyAcceptedAt,
      status: scenario.status === "PAID" ? "PENDING" : scenario.status,
      userId: scenario.user?.id ?? null,
    });

    if (scenario.status === "PAID") {
      await markBookingPaidOnce(booking.id);
    }

    created += 1;
  }

  return created;
}

async function seedRoomBookings(input: {
  admin: User;
  therapists: User[];
  rooms: Awaited<ReturnType<typeof listRooms>>;
}) {
  const now = new Date("2026-09-12T08:00:00.000Z");
  const [roomA, roomB] = input.rooms;
  if (!roomA || !roomB) {
    throw new Error("At least two rooms are required.");
  }

  const plans: Array<{
    user: User;
    roomId: string;
    date: string;
    start: string;
    end: string;
    cancel?: boolean;
  }> = [
    {
      user: input.therapists[0]!,
      roomId: roomA.id,
      date: "2026-09-14",
      start: "09:00",
      end: "10:30",
    },
    {
      user: input.therapists[1] ?? input.therapists[0]!,
      roomId: roomB.id,
      date: "2026-09-14",
      start: "14:00",
      end: "16:00",
    },
    {
      user: input.therapists[0]!,
      roomId: roomA.id,
      date: "2026-09-15",
      start: "10:00",
      end: "12:00",
    },
    {
      user: input.therapists[0]!,
      roomId: roomB.id,
      date: "2026-09-22",
      start: "14:00",
      end: "16:00",
    },
    {
      user: input.therapists[1] ?? input.therapists[0]!,
      roomId: roomA.id,
      date: "2026-09-18",
      start: "09:00",
      end: "11:00",
    },
    {
      user: input.therapists[2] ?? input.therapists[0]!,
      roomId: roomB.id,
      date: "2026-10-02",
      start: "13:00",
      end: "15:30",
      cancel: true,
    },
  ];

  let created = 0;
  for (const plan of plans) {
    try {
      const booking = await reserveRoom({
        actor: plan.user,
        roomId: plan.roomId,
        date: plan.date,
        start: plan.start,
        end: plan.end,
        now,
      });
      created += 1;
      if (plan.cancel) {
        await cancelRoomBooking({actor: plan.user, bookingId: booking.id, now});
      }
    } catch (error) {
      if (error instanceof RoomError && error.code === "slotConflict") {
        continue;
      }
      throw error;
    }
  }

  return created;
}

async function seedDevData() {
  await upsertSeedCatalogue();

  const primaryUsers = await Promise.all([
    upsertDevUser({
      email: "khourynawar+admin@gmail.com",
      firstName: "Nawar",
      lastName: "Admin",
      locale: "en",
      isAdmin: true,
    }),
    upsertDevUser({
      email: "khourynawar+therapist@gmail.com",
      firstName: "Nawar",
      lastName: "Therapist",
      locale: "en",
      roomBookingEnabled: true,
      roomDiscountPercent: 10,
    }),
    upsertDevUser({
      email: "khourynawar+student@gmail.com",
      firstName: "Nawar",
      lastName: "Student",
      locale: "en",
    }),
  ]);

  const [admin, therapist, student] = primaryUsers;

  const extraUsers = await Promise.all([
    upsertDevUser({
      email: "marie.dubois@example.test",
      firstName: "Marie",
      lastName: "Dubois",
      locale: "fr",
    }),
    upsertDevUser({
      email: "hans.mueller@example.test",
      firstName: "Hans",
      lastName: "Müller",
      locale: "de",
    }),
    upsertDevUser({
      email: "emma.wilson@example.test",
      firstName: "Emma",
      lastName: "Wilson",
      locale: "en",
    }),
    upsertDevUser({
      email: "luc.bernard@example.test",
      firstName: "Luc",
      lastName: "Bernard",
      locale: "fr",
      roomBookingEnabled: true,
    }),
    upsertDevUser({
      email: "sophie.meier@example.test",
      firstName: "Sophie",
      lastName: "Meier",
      locale: "de",
      roomBookingEnabled: true,
      roomDiscountPercent: 20,
    }),
    upsertDevUser({
      email: "james.brown@example.test",
      firstName: "James",
      lastName: "Brown",
      locale: "en",
    }),
  ]);

  const allUsers = [...primaryUsers, ...extraUsers];
  const courseBookings = await seedCourseBookings(allUsers);
  const rooms = await ensureRoomInfrastructure(admin);
  const roomBookings = await seedRoomBookings({
    admin,
    therapists: [therapist, ...extraUsers.filter((user) => user.roomBookingEnabled)],
    rooms,
  });

  console.log("Local dev data seeded.");
  console.log("");
  console.log("Primary accounts (password: abc123):");
  console.log("  khourynawar+admin@gmail.com     — admin");
  console.log("  khourynawar+therapist@gmail.com — room booking");
  console.log("  khourynawar+student@gmail.com   — student");
  console.log("");
  console.log(`Extra users: ${extraUsers.length}`);
  console.log(`Course bookings: ${courseBookings}`);
  console.log(`Rooms: ${rooms.length}`);
  console.log(`Room bookings: ${roomBookings}`);
}

seedDevData()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
