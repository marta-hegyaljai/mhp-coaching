ALTER TABLE "room_statements" ADD COLUMN "charge_attempt" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "room_statements" ADD COLUMN "charge_idempotency_key" text;
--> statement-breakpoint
ALTER TABLE "room_statements" ADD COLUMN "failure_code" text;
--> statement-breakpoint
CREATE UNIQUE INDEX "room_statements_payment_intent_uidx" ON "room_statements" ("stripe_payment_intent_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "room_statements_charge_idempotency_uidx" ON "room_statements" ("charge_idempotency_key");
--> statement-breakpoint
CREATE TYPE "room_notification_kind" AS ENUM('BOOKING_CONFIRMED', 'BOOKING_CHANGED', 'BOOKING_CANCELLED', 'BOOKING_REMINDER', 'ADMIN_CREATED', 'ADMIN_MOVED', 'REQUEST_CREATED', 'REQUEST_CREATED_STAFF', 'REQUEST_RESOLVED', 'REQUEST_DECLINED', 'STATEMENT_FINALIZED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED');
--> statement-breakpoint
CREATE TYPE "room_notification_status" AS ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED');
--> statement-breakpoint
CREATE TABLE "room_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" "room_notification_kind" NOT NULL,
	"status" "room_notification_status" DEFAULT 'PENDING' NOT NULL,
	"idempotency_key" text NOT NULL,
	"user_id" uuid NOT NULL,
	"booking_id" uuid,
	"statement_id" uuid,
	"request_id" uuid,
	"to_email" text NOT NULL,
	"locale" text NOT NULL,
	"provider" text,
	"provider_message_id" text,
	"last_error" text,
	"payload" jsonb NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "room_notifications_to_email_check" CHECK (char_length("to_email") > 0),
	CONSTRAINT "room_notifications_idempotency_check" CHECK (char_length("idempotency_key") > 0)
);
--> statement-breakpoint
ALTER TABLE "room_notifications" ADD CONSTRAINT "room_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_notifications" ADD CONSTRAINT "room_notifications_booking_id_room_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."room_bookings"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_notifications" ADD CONSTRAINT "room_notifications_statement_id_room_statements_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."room_statements"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_notifications" ADD CONSTRAINT "room_notifications_request_id_room_availability_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."room_availability_requests"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "room_notifications_idempotency_uidx" ON "room_notifications" ("idempotency_key");
--> statement-breakpoint
CREATE INDEX "room_notifications_user_id_idx" ON "room_notifications" ("user_id");
--> statement-breakpoint
CREATE INDEX "room_notifications_statement_id_idx" ON "room_notifications" ("statement_id");
--> statement-breakpoint
CREATE INDEX "room_notifications_booking_id_idx" ON "room_notifications" ("booking_id");
--> statement-breakpoint
CREATE INDEX "room_notifications_status_idx" ON "room_notifications" ("status");
--> statement-breakpoint
CREATE INDEX "room_notifications_created_at_idx" ON "room_notifications" ("created_at");
