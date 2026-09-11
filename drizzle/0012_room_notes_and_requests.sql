CREATE TABLE "room_booking_private_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"booking_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"ciphertext" bytea NOT NULL,
	"nonce" bytea NOT NULL,
	"key_version" smallint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_booking_private_notes" ADD CONSTRAINT "room_booking_private_notes_booking_id_room_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."room_bookings"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_booking_private_notes" ADD CONSTRAINT "room_booking_private_notes_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "room_booking_private_notes_booking_id_uidx" ON "room_booking_private_notes" ("booking_id");
--> statement-breakpoint
CREATE INDEX "room_booking_private_notes_owner_user_id_idx" ON "room_booking_private_notes" ("owner_user_id");
--> statement-breakpoint
CREATE TYPE "room_availability_request_status" AS ENUM('OPEN', 'RESOLVED', 'DECLINED');
--> statement-breakpoint
CREATE TABLE "room_availability_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"preferred_room_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"message" text,
	"status" "room_availability_request_status" DEFAULT 'OPEN' NOT NULL,
	"admin_note" text,
	"resolved_at" timestamp with time zone,
	"resolved_by_user_id" uuid,
	CONSTRAINT "room_availability_requests_range_check" CHECK ("ends_at" > "starts_at"),
	CONSTRAINT "room_availability_requests_resolution_check" CHECK (
		("status" = 'OPEN' AND "resolved_at" IS NULL AND "resolved_by_user_id" IS NULL)
		OR ("status" IN ('RESOLVED', 'DECLINED') AND "resolved_at" IS NOT NULL)
	)
);
--> statement-breakpoint
ALTER TABLE "room_availability_requests" ADD CONSTRAINT "room_availability_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_availability_requests" ADD CONSTRAINT "room_availability_requests_preferred_room_id_rooms_id_fk" FOREIGN KEY ("preferred_room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_availability_requests" ADD CONSTRAINT "room_availability_requests_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "room_availability_requests_user_id_idx" ON "room_availability_requests" ("user_id");
--> statement-breakpoint
CREATE INDEX "room_availability_requests_status_idx" ON "room_availability_requests" ("status");
--> statement-breakpoint
CREATE INDEX "room_availability_requests_starts_at_idx" ON "room_availability_requests" ("starts_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "room_availability_requests_open_slot_uidx" ON "room_availability_requests" (
	"user_id",
	"starts_at",
	"ends_at",
	(COALESCE("preferred_room_id", '00000000-0000-0000-0000-000000000000'::uuid))
) WHERE "status" = 'OPEN';
