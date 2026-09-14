CREATE TABLE "course_call_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weekday" smallint NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	CONSTRAINT "course_call_hours_range_check" CHECK ("end_minute" > "start_minute")
);
--> statement-breakpoint
CREATE INDEX "course_call_hours_weekday_idx" ON "course_call_hours" ("weekday");
--> statement-breakpoint
CREATE TYPE "public"."course_call_status" AS ENUM('SCHEDULED', 'CANCELLED');
--> statement-breakpoint
CREATE TABLE "course_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "course_call_status" DEFAULT 'SCHEDULED' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"locale" text NOT NULL,
	"course_id" text,
	"course_title" text,
	"message" text,
	"privacy_accepted_at" timestamp with time zone NOT NULL,
	CONSTRAINT "course_calls_range_check" CHECK ("ends_at" > "starts_at")
);
--> statement-breakpoint
CREATE INDEX "course_calls_starts_at_idx" ON "course_calls" ("starts_at");
--> statement-breakpoint
CREATE INDEX "course_calls_status_idx" ON "course_calls" ("status");
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "course_calls" ADD CONSTRAINT "course_calls_no_overlap"
	EXCLUDE USING gist (
		tstzrange("starts_at", "ends_at", '[)') WITH &&
	)
	WHERE ("status" = 'SCHEDULED');
--> statement-breakpoint
CREATE TABLE "course_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"message" text NOT NULL,
	"locale" text NOT NULL,
	"course_id" text,
	"course_title" text,
	"privacy_accepted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "course_inquiries_created_at_idx" ON "course_inquiries" ("created_at");
--> statement-breakpoint
INSERT INTO "course_call_hours" ("weekday", "start_minute", "end_minute") VALUES
	(1, 540, 720),
	(1, 840, 1020),
	(2, 540, 720),
	(2, 840, 1020),
	(3, 540, 720),
	(3, 840, 1020),
	(4, 540, 720),
	(4, 840, 1020),
	(5, 540, 720),
	(5, 840, 1020);
