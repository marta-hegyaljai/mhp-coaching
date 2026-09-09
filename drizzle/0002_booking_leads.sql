ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'LEAD' BEFORE 'PENDING';
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "street" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "postal_code" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "city" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "country" text DEFAULT 'CH' NOT NULL;
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"locale" text NOT NULL,
	"kind" text NOT NULL,
	"booking_id" uuid,
	"course_id" text,
	"course_title" text
);
--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;
