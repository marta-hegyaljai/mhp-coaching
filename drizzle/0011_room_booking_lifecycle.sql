CREATE TYPE "room_booking_billing_outcome" AS ENUM('USAGE', 'FREE_CANCELLATION', 'LATE_CANCELLATION', 'WAIVED');
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD COLUMN "billing_outcome" "room_booking_billing_outcome" DEFAULT 'USAGE' NOT NULL;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD COLUMN "cancelled_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD COLUMN "cancelled_by_user_id" uuid;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD COLUMN "waived_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD COLUMN "waived_by_user_id" uuid;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD COLUMN "successor_booking_id" uuid;
--> statement-breakpoint
UPDATE "room_bookings" SET "billing_outcome" = 'USAGE' WHERE "status" = 'CONFIRMED';
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_cancelled_by_user_id_users_id_fk" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_waived_by_user_id_users_id_fk" FOREIGN KEY ("waived_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_successor_booking_id_room_bookings_id_fk" FOREIGN KEY ("successor_booking_id") REFERENCES "public"."room_bookings"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_billing_status_check" CHECK (
	("status" = 'CONFIRMED' AND "billing_outcome" = 'USAGE' AND "cancelled_at" IS NULL AND "waived_at" IS NULL AND "waived_by_user_id" IS NULL)
	OR (
		"status" = 'CANCELLED'
		AND "billing_outcome" IN ('FREE_CANCELLATION', 'LATE_CANCELLATION', 'WAIVED')
		AND "cancelled_at" IS NOT NULL
	)
);
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_waiver_check" CHECK (
	("billing_outcome" <> 'WAIVED' AND "waived_at" IS NULL AND "waived_by_user_id" IS NULL)
	OR ("billing_outcome" = 'WAIVED' AND "waived_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX "room_bookings_status_idx" ON "room_bookings" ("status");
--> statement-breakpoint
CREATE TABLE "room_booking_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"booking_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	CONSTRAINT "room_booking_events_action_check" CHECK ("action" IN ('CREATED', 'MOVED', 'CANCELLED', 'WAIVED', 'ADMIN_CREATED', 'ADMIN_MOVED'))
);
--> statement-breakpoint
ALTER TABLE "room_booking_events" ADD CONSTRAINT "room_booking_events_booking_id_room_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."room_bookings"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_booking_events" ADD CONSTRAINT "room_booking_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "room_booking_events_booking_id_idx" ON "room_booking_events" ("booking_id");
--> statement-breakpoint
CREATE INDEX "room_booking_events_created_at_idx" ON "room_booking_events" ("created_at");
