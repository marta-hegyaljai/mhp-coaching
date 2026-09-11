ALTER TABLE "room_bookings" ADD COLUMN "created_by_user_id" uuid;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD COLUMN "room_name" text;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD COLUMN "base_hourly_rate_minor" integer;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD COLUMN "discount_percent" integer;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD COLUMN "effective_hourly_rate_minor" integer;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD COLUMN "duration_minutes" integer;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD COLUMN "amount_minor" integer;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD COLUMN "currency" text;
--> statement-breakpoint
UPDATE "room_bookings" AS booking
SET
	"created_by_user_id" = booking."user_id",
	"room_name" = room."name",
	"base_hourly_rate_minor" = room."hourly_rate_minor",
	"discount_percent" = 0,
	"effective_hourly_rate_minor" = room."hourly_rate_minor",
	"duration_minutes" = GREATEST(
		1,
		ROUND(EXTRACT(EPOCH FROM (booking."ends_at" - booking."starts_at")) / 60)::integer
	),
	"amount_minor" = ROUND(
		room."hourly_rate_minor"
		* GREATEST(
			1,
			ROUND(EXTRACT(EPOCH FROM (booking."ends_at" - booking."starts_at")) / 60)::integer
		)
		/ 60.0
	)::integer,
	"currency" = 'CHF'
FROM "rooms" AS room
WHERE room."id" = booking."room_id";
--> statement-breakpoint
ALTER TABLE "room_bookings" ALTER COLUMN "room_name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "room_bookings" ALTER COLUMN "base_hourly_rate_minor" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "room_bookings" ALTER COLUMN "discount_percent" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "room_bookings" ALTER COLUMN "effective_hourly_rate_minor" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "room_bookings" ALTER COLUMN "duration_minutes" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "room_bookings" ALTER COLUMN "amount_minor" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "room_bookings" ALTER COLUMN "currency" SET DEFAULT 'CHF';
--> statement-breakpoint
ALTER TABLE "room_bookings" ALTER COLUMN "currency" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_room_name_check" CHECK (char_length(btrim("room_name")) BETWEEN 1 AND 80);
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_base_rate_check" CHECK ("base_hourly_rate_minor" > 0);
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_discount_check" CHECK ("discount_percent" BETWEEN 0 AND 100);
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_effective_rate_check" CHECK ("effective_hourly_rate_minor" > 0);
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_duration_check" CHECK ("duration_minutes" > 0);
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_amount_check" CHECK ("amount_minor" > 0);
--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_currency_check" CHECK ("currency" = 'CHF');
