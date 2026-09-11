import {
  type AnyPgColumn,
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{data: Buffer; driverData: Buffer}>({
  dataType() {
    return "bytea";
  },
  toDriver(value) {
    return value;
  },
  fromDriver(value: unknown) {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    if (value instanceof Uint8Array) {
      return Buffer.from(value);
    }
    throw new Error("Unexpected bytea driver value");
  },
});

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
  userId: uuid("user_id").references(() => users.id, {onDelete: "set null"}),
  emailNormalized: text("email_normalized").notNull(),
},
  (table) => [
    index("bookings_user_id_idx").on(table.userId),
    index("bookings_email_normalized_idx").on(table.emailNormalized),
  ],
);

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

export const authTokenPurposeEnum = pgEnum("auth_token_purpose", [
  "invite",
  "verify",
  "recovery",
  "email_change",
]);

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
    pendingEmail: text("pending_email"),
    pendingEmailNormalized: text("pending_email_normalized"),
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

export const courseCertificateStatusEnum = pgEnum("course_certificate_status", [
  "ACTIVE",
  "REVOKED",
]);

export const courseCertificateDocuments = pgTable("course_certificate_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", {withTimezone: true})
    .defaultNow()
    .notNull(),
  bytes: bytea("bytes").notNull(),
  byteSize: integer("byte_size").notNull(),
  contentType: text("content_type").notNull(),
});

export const courseCertificates = pgTable(
  "course_certificates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {onDelete: "cascade"}),
    courseId: text("course_id").notNull(),
    courseTitle: jsonb("course_title").$type<LocalizedJson>().notNull(),
    issuedOn: date("issued_on", {mode: "string"}).notNull(),
    status: courseCertificateStatusEnum("status").notNull().default("ACTIVE"),
    documentId: uuid("document_id").references(() => courseCertificateDocuments.id, {
      onDelete: "set null",
    }),
    revokedAt: timestamp("revoked_at", {withTimezone: true}),
    revokedByUserId: uuid("revoked_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("course_certificates_user_id_idx").on(table.userId),
    index("course_certificates_issued_on_idx").on(table.issuedOn),
    index("course_certificates_status_idx").on(table.status),
  ],
);

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    hourlyRateMinor: integer("hourly_rate_minor").notNull(),
    currency: text("currency").notNull().default("CHF"),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull(),
  },
  (table) => [
    index("rooms_display_order_idx").on(table.displayOrder),
    index("rooms_active_idx").on(table.active),
  ],
);

export const roomBookingSettings = pgTable("room_booking_settings", {
  id: smallint("id").primaryKey().default(1),
  timezone: text("timezone").notNull().default("Europe/Zurich"),
  cancellationNoticeHours: integer("cancellation_notice_hours").notNull().default(48),
  bookingIntervalMinutes: integer("booking_interval_minutes").notNull().default(30),
  minimumBookingMinutes: integer("minimum_booking_minutes").notNull().default(60),
  maximumBookingMinutes: integer("maximum_booking_minutes"),
  maximumAdvanceBookingDays: integer("maximum_advance_booking_days"),
  reminderNoticeHours: integer("reminder_notice_hours").notNull().default(24),
  updatedAt: timestamp("updated_at", {withTimezone: true}).defaultNow().notNull(),
});

export const roomOpeningIntervals = pgTable(
  "room_opening_intervals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    weekday: smallint("weekday").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
  },
  (table) => [index("room_opening_intervals_weekday_idx").on(table.weekday)],
);

export const roomBlocks = pgTable(
  "room_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, {onDelete: "cascade"}),
    startsAt: timestamp("starts_at", {withTimezone: true}).notNull(),
    endsAt: timestamp("ends_at", {withTimezone: true}).notNull(),
    reason: text("reason").notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("room_blocks_room_id_idx").on(table.roomId),
    index("room_blocks_range_idx").on(table.startsAt, table.endsAt),
  ],
);

export const roomBookingStatusEnum = pgEnum("room_booking_status", [
  "CONFIRMED",
  "CANCELLED",
]);

export const roomBookingBillingOutcomeEnum = pgEnum("room_booking_billing_outcome", [
  "USAGE",
  "FREE_CANCELLATION",
  "LATE_CANCELLATION",
  "WAIVED",
]);

export const roomBookings = pgTable(
  "room_bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, {onDelete: "restrict"}),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    startsAt: timestamp("starts_at", {withTimezone: true}).notNull(),
    endsAt: timestamp("ends_at", {withTimezone: true}).notNull(),
    status: roomBookingStatusEnum("status").notNull().default("CONFIRMED"),
    billingOutcome: roomBookingBillingOutcomeEnum("billing_outcome")
      .notNull()
      .default("USAGE"),
    cancelledAt: timestamp("cancelled_at", {withTimezone: true}),
    cancelledByUserId: uuid("cancelled_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    waivedAt: timestamp("waived_at", {withTimezone: true}),
    waivedByUserId: uuid("waived_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    successorBookingId: uuid("successor_booking_id").references(
      (): AnyPgColumn => roomBookings.id,
      {onDelete: "set null"},
    ),
    roomName: text("room_name").notNull(),
    baseHourlyRateMinor: integer("base_hourly_rate_minor").notNull(),
    discountPercent: integer("discount_percent").notNull(),
    effectiveHourlyRateMinor: integer("effective_hourly_rate_minor").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().default("CHF"),
  },
  (table) => [
    index("room_bookings_room_id_idx").on(table.roomId),
    index("room_bookings_user_id_idx").on(table.userId),
    index("room_bookings_range_idx").on(table.startsAt, table.endsAt),
    index("room_bookings_status_idx").on(table.status),
  ],
);

export const roomBookingEvents = pgTable(
  "room_booking_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => roomBookings.id, {onDelete: "cascade"}),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
  },
  (table) => [
    index("room_booking_events_booking_id_idx").on(table.bookingId),
    index("room_booking_events_created_at_idx").on(table.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type AuthToken = typeof authTokens.$inferSelect;
export type AuthTokenPurpose = (typeof authTokenPurposeEnum.enumValues)[number];
export type AuditEvent = typeof auditEvents.$inferSelect;
export type CourseRow = typeof courses.$inferSelect;
export type CourseSessionRow = typeof courseSessions.$inferSelect;
export type CourseCertificate = typeof courseCertificates.$inferSelect;
export type CourseCertificateDocument = typeof courseCertificateDocuments.$inferSelect;
export type CourseCertificateStatus =
  (typeof courseCertificateStatusEnum.enumValues)[number];
export type Room = typeof rooms.$inferSelect;
export type RoomBookingSettings = typeof roomBookingSettings.$inferSelect;
export type RoomOpeningInterval = typeof roomOpeningIntervals.$inferSelect;
export type RoomBlock = typeof roomBlocks.$inferSelect;
export type RoomBooking = typeof roomBookings.$inferSelect;
export type RoomBookingStatus = (typeof roomBookingStatusEnum.enumValues)[number];
export type RoomBookingBillingOutcome =
  (typeof roomBookingBillingOutcomeEnum.enumValues)[number];
export type RoomBookingEvent = typeof roomBookingEvents.$inferSelect;
