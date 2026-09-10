import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const bookingStatusEnum = pgEnum("booking_status", [
  "LEAD",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
]);

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", {withTimezone: true})
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {withTimezone: true})
    .defaultNow()
    .notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  street: text("street").notNull(),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  locale: text("locale").notNull(),
  courseId: text("course_id").notNull(),
  courseDateId: text("course_date_id").notNull(),
  courseTitle: text("course_title").notNull(),
  courseDateStart: text("course_date_start").notNull(),
  courseDateEnd: text("course_date_end"),
  location: text("location").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  paymentProvider: text("payment_provider").notNull(),
  paymentReference: text("payment_reference"),
  status: bookingStatusEnum("status").notNull().default("PENDING"),
  paidAt: timestamp("paid_at", {withTimezone: true}),
  confirmationEmailSentAt: timestamp("confirmation_email_sent_at", {
    withTimezone: true,
  }),
  privacyAcceptedAt: timestamp("privacy_accepted_at", {withTimezone: true})
    .notNull(),
});

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id),
    provider: text("provider").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload"),
  },
  (table) => [
    unique("payment_events_provider_event_unique").on(
      table.provider,
      table.providerEventId,
    ),
  ],
);

export const inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", {withTimezone: true})
    .defaultNow()
    .notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  locale: text("locale").notNull(),
  kind: text("kind").notNull(),
  bookingId: uuid("booking_id").references(() => bookings.id),
  courseId: text("course_id"),
  courseTitle: text("course_title"),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
export type Inquiry = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;

export const waitlistEntries = pgTable(
  "waitlist_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    courseId: text("course_id").notNull(),
    courseTitle: text("course_title").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    locale: text("locale").notNull(),
    privacyAcceptedAt: timestamp("privacy_accepted_at", {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    unique("waitlist_entries_course_email_unique").on(
      table.courseId,
      table.email,
    ),
  ],
);

export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
export type NewWaitlistEntry = typeof waitlistEntries.$inferInsert;

export type LocalizedJson = {
  fr: string;
  de: string;
  en: string;
};

export const authTokenPurposeEnum = pgEnum("auth_token_purpose", ["invite"]);

export const courseCategoryEnum = pgEnum("course_category", [
  "foundation",
  "advanced",
  "medical",
  "workshop",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    email: text("email").notNull(),
    emailNormalized: text("email_normalized").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", {withTimezone: true}),
    passwordHash: text("password_hash"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    locale: text("locale").notNull().default("fr"),
    isAdmin: boolean("is_admin").notNull().default(false),
    roomBookingEnabled: boolean("room_booking_enabled").notNull().default(false),
    disabledAt: timestamp("disabled_at", {withTimezone: true}),
  },
  (table) => [
    uniqueIndex("users_email_normalized_unique").on(table.emailNormalized),
    index("users_created_at_idx").on(table.createdAt),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {onDelete: "cascade"}),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", {withTimezone: true}).notNull(),
    revokedAt: timestamp("revoked_at", {withTimezone: true}),
    lastSeenAt: timestamp("last_seen_at", {withTimezone: true}),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {onDelete: "cascade"}),
    purpose: authTokenPurposeEnum("purpose").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", {withTimezone: true}).notNull(),
    consumedAt: timestamp("consumed_at", {withTimezone: true}),
  },
  (table) => [
    uniqueIndex("auth_tokens_token_hash_unique").on(table.tokenHash),
    index("auth_tokens_user_id_idx").on(table.userId),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    targetUserId: uuid("target_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
  },
  (table) => [
    index("audit_events_target_user_id_idx").on(table.targetUserId),
    index("audit_events_created_at_idx").on(table.createdAt),
    index("audit_events_action_idx").on(table.action),
  ],
);

export const authAttempts = pgTable(
  "auth_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    action: text("action").notNull(),
    subject: text("subject").notNull(),
  },
  (table) => [
    index("auth_attempts_action_subject_created_idx").on(
      table.action,
      table.subject,
      table.createdAt,
    ),
  ],
);

export const courses = pgTable(
  "courses",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    slug: jsonb("slug").$type<LocalizedJson>().notNull(),
    title: jsonb("title").$type<LocalizedJson>().notNull(),
    shortDescription: jsonb("short_description").$type<LocalizedJson>().notNull(),
    description: jsonb("description").$type<LocalizedJson>().notNull(),
    audience: jsonb("audience").$type<LocalizedJson>().notNull(),
    duration: jsonb("duration").$type<LocalizedJson>().notNull(),
    location: jsonb("location").$type<LocalizedJson>().notNull(),
    priceChf: integer("price_chf").notNull(),
    category: courseCategoryEnum("category").notNull(),
    published: boolean("published").notNull().default(true),
    displayOrder: integer("display_order").notNull(),
  },
  (table) => [
    index("courses_published_idx").on(table.published),
    index("courses_display_order_idx").on(table.displayOrder),
  ],
);

export const courseSessions = pgTable(
  "course_sessions",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, {onDelete: "cascade"}),
    startDate: date("start_date", {mode: "string"}).notNull(),
    endDate: date("end_date", {mode: "string"}),
    location: jsonb("location").$type<LocalizedJson>().notNull(),
    venue: jsonb("venue").$type<LocalizedJson>(),
    capacity: integer("capacity").notNull(),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull(),
  },
  (table) => [index("course_sessions_course_id_idx").on(table.courseId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type AuthToken = typeof authTokens.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type CourseRow = typeof courses.$inferSelect;
export type CourseSessionRow = typeof courseSessions.$inferSelect;
