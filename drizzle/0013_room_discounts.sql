ALTER TABLE "users" ADD COLUMN "room_discount_percent" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_room_discount_percent_check" CHECK ("room_discount_percent" >= 0 AND "room_discount_percent" <= 99);
