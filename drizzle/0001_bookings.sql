CREATE TYPE "booking_status" AS ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"locale" text NOT NULL,
	"course_id" text NOT NULL,
	"course_date_id" text NOT NULL,
	"course_title" text NOT NULL,
	"course_date_start" text NOT NULL,
	"course_date_end" text,
	"location" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text NOT NULL,
	"payment_provider" text NOT NULL,
	"payment_reference" text,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"paid_at" timestamp with time zone,
	"confirmation_email_sent_at" timestamp with time zone,
	"privacy_accepted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"booking_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_event_id" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb,
	CONSTRAINT "payment_events_provider_event_unique" UNIQUE("provider","provider_event_id")
);
--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "bookings_created_at_idx" ON "bookings" ("created_at");
--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" ("status");
--> statement-breakpoint
DROP TABLE "bootstrap_checks";
