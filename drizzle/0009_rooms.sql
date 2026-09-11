CREATE TYPE "room_booking_status" AS ENUM('CONFIRMED', 'CANCELLED');
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"hourly_rate_minor" integer NOT NULL,
	"currency" text DEFAULT 'CHF' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"display_order" integer NOT NULL,
	CONSTRAINT "rooms_name_length_check" CHECK (char_length(btrim("name")) BETWEEN 1 AND 80),
	CONSTRAINT "rooms_description_length_check" CHECK (char_length("description") <= 2000),
	CONSTRAINT "rooms_hourly_rate_check" CHECK ("hourly_rate_minor" > 0),
	CONSTRAINT "rooms_currency_check" CHECK ("currency" = 'CHF')
);
--> statement-breakpoint
CREATE INDEX "rooms_display_order_idx" ON "rooms" ("display_order");
--> statement-breakpoint
CREATE INDEX "rooms_active_idx" ON "rooms" ("active");
--> statement-breakpoint
CREATE TABLE "room_booking_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"timezone" text DEFAULT 'Europe/Zurich' NOT NULL,
	"cancellation_notice_hours" integer DEFAULT 48 NOT NULL,
	"booking_interval_minutes" integer DEFAULT 30 NOT NULL,
	"minimum_booking_minutes" integer DEFAULT 60 NOT NULL,
	"maximum_booking_minutes" integer,
	"maximum_advance_booking_days" integer,
	"reminder_notice_hours" integer DEFAULT 24 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_booking_settings_singleton_check" CHECK ("id" = 1),
	CONSTRAINT "room_booking_settings_timezone_check" CHECK ("timezone" = 'Europe/Zurich'),
	CONSTRAINT "room_booking_settings_interval_check" CHECK ("booking_interval_minutes" IN (15, 30, 60)),
	CONSTRAINT "room_booking_settings_minimum_check" CHECK ("minimum_booking_minutes" >= "booking_interval_minutes"),
	CONSTRAINT "room_booking_settings_maximum_check" CHECK ("maximum_booking_minutes" IS NULL OR "maximum_booking_minutes" >= "minimum_booking_minutes"),
	CONSTRAINT "room_booking_settings_notice_check" CHECK ("cancellation_notice_hours" >= 0 AND "reminder_notice_hours" >= 0),
	CONSTRAINT "room_booking_settings_advance_check" CHECK ("maximum_advance_booking_days" IS NULL OR "maximum_advance_booking_days" >= 0)
);
--> statement-breakpoint
INSERT INTO "room_booking_settings" ("id") VALUES (1);
--> statement-breakpoint
CREATE TABLE "room_opening_intervals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weekday" smallint NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	CONSTRAINT "room_opening_intervals_weekday_check" CHECK ("weekday" BETWEEN 1 AND 7),
	CONSTRAINT "room_opening_intervals_start_check" CHECK ("start_minute" >= 0 AND "start_minute" < 1440),
	CONSTRAINT "room_opening_intervals_end_check" CHECK ("end_minute" > "start_minute" AND "end_minute" <= 1440)
);
--> statement-breakpoint
CREATE INDEX "room_opening_intervals_weekday_idx" ON "room_opening_intervals" ("weekday");
--> statement-breakpoint
INSERT INTO "room_opening_intervals" ("weekday", "start_minute", "end_minute")
VALUES
	(1, 420, 1260),
	(2, 420, 1260),
	(3, 420, 1260),
	(4, 420, 1260),
	(5, 420, 1260),
	(6, 480, 1080);
--> statement-breakpoint
CREATE TABLE "room_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"room_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"created_by_user_id" uuid,
	CONSTRAINT "room_blocks_range_check" CHECK ("ends_at" > "starts_at"),
	CONSTRAINT "room_blocks_reason_check" CHECK (char_length(btrim("reason")) BETWEEN 1 AND 200)
);
--> statement-breakpoint
ALTER TABLE "room_blocks" ADD CONSTRAINT "room_blocks_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_blocks" ADD CONSTRAINT "room_blocks_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "room_blocks_room_id_idx" ON "room_blocks" ("room_id");
--> statement-breakpoint
CREATE INDEX "room_blocks_range_idx" ON "room_blocks" ("starts_at", "ends_at");
--> statement-breakpoint
CREATE TABLE "room_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "room_booking_status" DEFAULT 'CONFIRMED' NOT NULL,
	CONSTRAINT "room_bookings_range_check" CHECK ("ends_at" > "starts_at")
);
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "room_bookings_room_id_idx" ON "room_bookings" ("room_id");
--> statement-breakpoint
CREATE INDEX "room_bookings_user_id_idx" ON "room_bookings" ("user_id");
--> statement-breakpoint
CREATE INDEX "room_bookings_range_idx" ON "room_bookings" ("starts_at", "ends_at");
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_no_overlap"
	EXCLUDE USING gist (
		"room_id" WITH =,
		tstzrange("starts_at", "ends_at", '[)') WITH &&
	)
	WHERE ("status" = 'CONFIRMED');
