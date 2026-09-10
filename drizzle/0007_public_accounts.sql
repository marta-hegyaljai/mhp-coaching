ALTER TYPE "auth_token_purpose" ADD VALUE IF NOT EXISTS 'verify';
--> statement-breakpoint
ALTER TYPE "auth_token_purpose" ADD VALUE IF NOT EXISTS 'recovery';
--> statement-breakpoint
ALTER TYPE "auth_token_purpose" ADD VALUE IF NOT EXISTS 'email_change';
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pending_email" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pending_email_normalized" text;
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "email_normalized" text;
--> statement-breakpoint
UPDATE "bookings"
SET "email_normalized" = lower(trim("email"))
WHERE "email_normalized" IS NULL;
--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "email_normalized" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "bookings" ("user_id");
--> statement-breakpoint
CREATE INDEX "bookings_email_normalized_idx" ON "bookings" ("email_normalized");
