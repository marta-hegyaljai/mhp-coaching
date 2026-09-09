import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
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
