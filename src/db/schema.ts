import {sql} from "drizzle-orm";
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
  primaryKey,
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
  dateOfBirth: date("date_of_birth", {mode: "string"}),
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
    courseSessionId: text("course_session_id"),
    notifiedAt: timestamp("notified_at", {withTimezone: true}),
  },
  (table) => [
    uniqueIndex("waitlist_entries_course_email_session_uidx")
      .on(table.courseId, table.email, table.courseSessionId)
      .where(sql`${table.courseSessionId} is not null`),
    uniqueIndex("waitlist_entries_course_email_course_uidx")
      .on(table.courseId, table.email)
      .where(sql`${table.courseSessionId} is null`),
  ],
);

export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
export type NewWaitlistEntry = typeof waitlistEntries.$inferInsert;

export const courseCallHours = pgTable(
  "course_call_hours",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    weekday: smallint("weekday").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
  },
  (table) => [index("course_call_hours_weekday_idx").on(table.weekday)],
);

export const courseCallStatusEnum = pgEnum("course_call_status", [
  "SCHEDULED",
  "CANCELLED",
]);

export const courseCalls = pgTable(
  "course_calls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    startsAt: timestamp("starts_at", {withTimezone: true}).notNull(),
    endsAt: timestamp("ends_at", {withTimezone: true}).notNull(),
    status: courseCallStatusEnum("status").notNull().default("SCHEDULED"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    locale: text("locale").notNull(),
    courseId: text("course_id"),
    courseTitle: text("course_title"),
    message: text("message"),
    privacyAcceptedAt: timestamp("privacy_accepted_at", {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    index("course_calls_starts_at_idx").on(table.startsAt),
    index("course_calls_status_idx").on(table.status),
  ],
);

export const courseInquiries = pgTable(
  "course_inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    message: text("message").notNull(),
    locale: text("locale").notNull(),
    courseId: text("course_id"),
    courseTitle: text("course_title"),
    privacyAcceptedAt: timestamp("privacy_accepted_at", {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [index("course_inquiries_created_at_idx").on(table.createdAt)],
);

export type CourseCallHour = typeof courseCallHours.$inferSelect;
export type NewCourseCallHour = typeof courseCallHours.$inferInsert;
export type CourseCall = typeof courseCalls.$inferSelect;
export type NewCourseCall = typeof courseCalls.$inferInsert;
export type CourseCallStatus = (typeof courseCallStatusEnum.enumValues)[number];
export type CourseInquiry = typeof courseInquiries.$inferSelect;
export type NewCourseInquiry = typeof courseInquiries.$inferInsert;

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
  "supervision",
]);

/**
 * `module` is a course sold on its own. `programme` bundles several modules
 * into one purchasable learning path and is presented separately.
 */
export const courseFormatEnum = pgEnum("course_format", ["module", "programme"]);

/** Public CTA. `auto` follows dates and remaining seats. */
export const courseAvailabilityEnum = pgEnum("course_availability", [
  "auto",
  "available",
  "full",
  "dates_pending",
  "registration_closed",
]);

export const sessionAvailabilityEnum = pgEnum("session_availability", [
  "auto",
  "available",
  "full",
  "registration_closed",
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
    phone: text("phone"),
    street: text("street"),
    postalCode: text("postal_code"),
    city: text("city"),
    country: text("country"),
    locale: text("locale").notNull().default("fr"),
    isAdmin: boolean("is_admin").notNull().default(false),
    roomBookingEnabled: boolean("room_booking_enabled").notNull().default(false),
    roomDiscountPercent: integer("room_discount_percent").notNull().default(0),
    stripeCustomerId: text("stripe_customer_id"),
    stripePaymentMethodId: text("stripe_payment_method_id"),
    paymentMethodBrand: text("payment_method_brand"),
    paymentMethodLast4: text("payment_method_last4"),
    paymentMethodExpMonth: integer("payment_method_exp_month"),
    paymentMethodExpYear: integer("payment_method_exp_year"),
    disabledAt: timestamp("disabled_at", {withTimezone: true}),
    pendingEmail: text("pending_email"),
    pendingEmailNormalized: text("pending_email_normalized"),
  },
  (table) => [
    uniqueIndex("users_email_normalized_unique").on(table.emailNormalized),
    uniqueIndex("users_stripe_customer_id_uidx").on(table.stripeCustomerId),
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
    format: courseFormatEnum("format").notNull().default("module"),
    published: boolean("published").notNull().default(true),
    availability: courseAvailabilityEnum("availability").notNull().default("auto"),
    displayOrder: integer("display_order").notNull(),
  },
  (table) => [
    index("courses_published_idx").on(table.published),
    index("courses_display_order_idx").on(table.displayOrder),
    index("courses_format_idx").on(table.format),
  ],
);

/** Modules bundled into a programme course, in presentation order. */
export const courseProgrammeModules = pgTable(
  "course_programme_modules",
  {
    programmeId: text("programme_id")
      .notNull()
      .references(() => courses.id, {onDelete: "cascade"}),
    moduleId: text("module_id")
      .notNull()
      .references(() => courses.id, {onDelete: "cascade"}),
    displayOrder: integer("display_order").notNull(),
  },
  (table) => [
    primaryKey({columns: [table.programmeId, table.moduleId]}),
    index("course_programme_modules_module_idx").on(table.moduleId),
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
    availability: sessionAvailabilityEnum("availability").notNull().default("auto"),
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

export const roomBookingPrivateNotes = pgTable(
  "room_booking_private_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => roomBookings.id, {onDelete: "cascade"}),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, {onDelete: "cascade"}),
    ciphertext: bytea("ciphertext").notNull(),
    nonce: bytea("nonce").notNull(),
    keyVersion: smallint("key_version").notNull(),
  },
  (table) => [
    uniqueIndex("room_booking_private_notes_booking_id_uidx").on(table.bookingId),
    index("room_booking_private_notes_owner_user_id_idx").on(table.ownerUserId),
  ],
);

export const roomAvailabilityRequestStatusEnum = pgEnum(
  "room_availability_request_status",
  ["OPEN", "RESOLVED", "DECLINED"],
);

export const roomAvailabilityRequests = pgTable(
  "room_availability_requests",
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
      .references(() => users.id, {onDelete: "restrict"}),
    preferredRoomId: uuid("preferred_room_id").references(() => rooms.id, {
      onDelete: "set null",
    }),
    startsAt: timestamp("starts_at", {withTimezone: true}).notNull(),
    endsAt: timestamp("ends_at", {withTimezone: true}).notNull(),
    message: text("message"),
    status: roomAvailabilityRequestStatusEnum("status").notNull().default("OPEN"),
    adminNote: text("admin_note"),
    resolvedAt: timestamp("resolved_at", {withTimezone: true}),
    resolvedByUserId: uuid("resolved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("room_availability_requests_user_id_idx").on(table.userId),
    index("room_availability_requests_status_idx").on(table.status),
    index("room_availability_requests_starts_at_idx").on(table.startsAt),
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
export type CourseProgrammeModuleRow = typeof courseProgrammeModules.$inferSelect;
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
export type RoomBookingPrivateNote = typeof roomBookingPrivateNotes.$inferSelect;
export const roomStatementStatusEnum = pgEnum("room_statement_status", [
  "OPEN",
  "FINALIZED",
  "PAYMENT_PENDING",
  "PAID",
  "PAYMENT_FAILED",
]);

export const roomStatementLineKindEnum = pgEnum("room_statement_line_kind", [
  "USAGE",
  "LATE_CANCELLATION",
  "ADJUSTMENT",
]);

export const roomStatements = pgTable(
  "room_statements",
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
      .references(() => users.id, {onDelete: "restrict"}),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    monthStart: timestamp("month_start", {withTimezone: true}).notNull(),
    monthEndExclusive: timestamp("month_end_exclusive", {withTimezone: true}).notNull(),
    status: roomStatementStatusEnum("status").notNull().default("OPEN"),
    currency: text("currency").notNull().default("CHF"),
    billedMinutes: integer("billed_minutes").notNull().default(0),
    totalMinor: integer("total_minor").notNull(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    chargeAttempt: integer("charge_attempt").notNull().default(0),
    chargeIdempotencyKey: text("charge_idempotency_key"),
    failureCode: text("failure_code"),
    finalizedAt: timestamp("finalized_at", {withTimezone: true}),
    finalizedByUserId: uuid("finalized_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    paidAt: timestamp("paid_at", {withTimezone: true}),
  },
  (table) => [
    uniqueIndex("room_statements_user_month_uidx").on(table.userId, table.year, table.month),
    uniqueIndex("room_statements_payment_intent_uidx").on(table.stripePaymentIntentId),
    uniqueIndex("room_statements_charge_idempotency_uidx").on(table.chargeIdempotencyKey),
    index("room_statements_user_id_idx").on(table.userId),
    index("room_statements_status_idx").on(table.status),
    index("room_statements_month_idx").on(table.year, table.month),
  ],
);

export const roomStatementLineItems = pgTable(
  "room_statement_line_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    statementId: uuid("statement_id")
      .notNull()
      .references(() => roomStatements.id, {onDelete: "cascade"}),
    kind: roomStatementLineKindEnum("kind").notNull(),
    bookingId: uuid("booking_id").references(() => roomBookings.id, {
      onDelete: "restrict",
    }),
    description: text("description").notNull(),
    minutes: integer("minutes").notNull().default(0),
    amountMinor: integer("amount_minor").notNull(),
    reason: text("reason"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("room_statement_line_items_statement_id_idx").on(table.statementId),
    uniqueIndex("room_statement_line_items_booking_uidx").on(table.statementId, table.bookingId),
  ],
);

export type RoomAvailabilityRequest = typeof roomAvailabilityRequests.$inferSelect;
export type RoomAvailabilityRequestStatus =
  (typeof roomAvailabilityRequestStatusEnum.enumValues)[number];
export type RoomStatement = typeof roomStatements.$inferSelect;
export type RoomStatementStatus = (typeof roomStatementStatusEnum.enumValues)[number];
export type RoomStatementLineItem = typeof roomStatementLineItems.$inferSelect;
export type RoomStatementLineKind = (typeof roomStatementLineKindEnum.enumValues)[number];

export const roomNotificationKindEnum = pgEnum("room_notification_kind", [
  "BOOKING_CONFIRMED",
  "BOOKING_CHANGED",
  "BOOKING_CANCELLED",
  "BOOKING_REMINDER",
  "ADMIN_CREATED",
  "ADMIN_MOVED",
  "REQUEST_CREATED",
  "REQUEST_CREATED_STAFF",
  "REQUEST_RESOLVED",
  "REQUEST_DECLINED",
  "STATEMENT_FINALIZED",
  "PAYMENT_SUCCEEDED",
  "PAYMENT_FAILED",
]);

export const roomNotificationStatusEnum = pgEnum("room_notification_status", [
  "PENDING",
  "SENT",
  "FAILED",
  "SKIPPED",
]);

export const roomNotifications = pgTable(
  "room_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    kind: roomNotificationKindEnum("kind").notNull(),
    status: roomNotificationStatusEnum("status").notNull().default("PENDING"),
    idempotencyKey: text("idempotency_key").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {onDelete: "restrict"}),
    bookingId: uuid("booking_id").references(() => roomBookings.id, {
      onDelete: "set null",
    }),
    statementId: uuid("statement_id").references(() => roomStatements.id, {
      onDelete: "set null",
    }),
    requestId: uuid("request_id").references(() => roomAvailabilityRequests.id, {
      onDelete: "set null",
    }),
    toEmail: text("to_email").notNull(),
    locale: text("locale").notNull(),
    provider: text("provider"),
    providerMessageId: text("provider_message_id"),
    lastError: text("last_error"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    sentAt: timestamp("sent_at", {withTimezone: true}),
  },
  (table) => [
    uniqueIndex("room_notifications_idempotency_uidx").on(table.idempotencyKey),
    index("room_notifications_user_id_idx").on(table.userId),
    index("room_notifications_statement_id_idx").on(table.statementId),
    index("room_notifications_booking_id_idx").on(table.bookingId),
    index("room_notifications_status_idx").on(table.status),
    index("room_notifications_created_at_idx").on(table.createdAt),
  ],
);

export type RoomNotification = typeof roomNotifications.$inferSelect;
export type RoomNotificationKind = (typeof roomNotificationKindEnum.enumValues)[number];
export type RoomNotificationStatus = (typeof roomNotificationStatusEnum.enumValues)[number];

export const opsHeartbeats = pgTable(
  "ops_heartbeats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", {withTimezone: true})
      .defaultNow()
      .notNull(),
    job: text("job").notNull(),
    ok: boolean("ok").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    error: text("error"),
  },
  (table) => [
    index("ops_heartbeats_job_created_at_idx").on(table.job, table.createdAt),
  ],
);

export type OpsHeartbeat = typeof opsHeartbeats.$inferSelect;
