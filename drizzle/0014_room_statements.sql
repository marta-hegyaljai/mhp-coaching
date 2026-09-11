ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_payment_method_id" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payment_method_brand" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payment_method_last4" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payment_method_exp_month" integer;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payment_method_exp_year" integer;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_payment_method_last4_check" CHECK ("payment_method_last4" IS NULL OR "payment_method_last4" ~ '^[0-9]{4}$');
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_payment_method_exp_month_check" CHECK ("payment_method_exp_month" IS NULL OR ("payment_method_exp_month" >= 1 AND "payment_method_exp_month" <= 12));
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_payment_method_exp_year_check" CHECK ("payment_method_exp_year" IS NULL OR "payment_method_exp_year" >= 2000);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_stripe_customer_id_uidx" ON "users" ("stripe_customer_id");
--> statement-breakpoint
CREATE TYPE "room_statement_status" AS ENUM('OPEN', 'FINALIZED', 'PAYMENT_PENDING', 'PAID', 'PAYMENT_FAILED');
--> statement-breakpoint
CREATE TYPE "room_statement_line_kind" AS ENUM('USAGE', 'LATE_CANCELLATION', 'ADJUSTMENT');
--> statement-breakpoint
CREATE TABLE "room_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"month_start" timestamp with time zone NOT NULL,
	"month_end_exclusive" timestamp with time zone NOT NULL,
	"status" "room_statement_status" DEFAULT 'OPEN' NOT NULL,
	"currency" text DEFAULT 'CHF' NOT NULL,
	"billed_minutes" integer DEFAULT 0 NOT NULL,
	"total_minor" integer NOT NULL,
	"stripe_payment_intent_id" text,
	"finalized_at" timestamp with time zone,
	"finalized_by_user_id" uuid,
	"paid_at" timestamp with time zone,
	CONSTRAINT "room_statements_month_check" CHECK ("month" >= 1 AND "month" <= 12),
	CONSTRAINT "room_statements_year_check" CHECK ("year" >= 2000 AND "year" <= 2100),
	CONSTRAINT "room_statements_minutes_check" CHECK ("billed_minutes" >= 0)
);
--> statement-breakpoint
ALTER TABLE "room_statements" ADD CONSTRAINT "room_statements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_statements" ADD CONSTRAINT "room_statements_finalized_by_user_id_users_id_fk" FOREIGN KEY ("finalized_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "room_statements_user_month_uidx" ON "room_statements" ("user_id","year","month");
--> statement-breakpoint
CREATE INDEX "room_statements_user_id_idx" ON "room_statements" ("user_id");
--> statement-breakpoint
CREATE INDEX "room_statements_status_idx" ON "room_statements" ("status");
--> statement-breakpoint
CREATE INDEX "room_statements_month_idx" ON "room_statements" ("year","month");
--> statement-breakpoint
CREATE TABLE "room_statement_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"statement_id" uuid NOT NULL,
	"kind" "room_statement_line_kind" NOT NULL,
	"booking_id" uuid,
	"description" text NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"amount_minor" integer NOT NULL,
	"reason" text,
	"created_by_user_id" uuid,
	CONSTRAINT "room_statement_line_items_minutes_check" CHECK ("minutes" >= 0),
	CONSTRAINT "room_statement_line_items_description_check" CHECK (char_length("description") > 0),
	CONSTRAINT "room_statement_line_items_kind_shape_check" CHECK (
		("kind" = 'ADJUSTMENT' AND "booking_id" IS NULL AND "reason" IS NOT NULL)
		OR ("kind" <> 'ADJUSTMENT' AND "booking_id" IS NOT NULL AND "reason" IS NULL)
	)
);
--> statement-breakpoint
ALTER TABLE "room_statement_line_items" ADD CONSTRAINT "room_statement_line_items_statement_id_room_statements_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."room_statements"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_statement_line_items" ADD CONSTRAINT "room_statement_line_items_booking_id_room_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."room_bookings"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_statement_line_items" ADD CONSTRAINT "room_statement_line_items_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "room_statement_line_items_statement_id_idx" ON "room_statement_line_items" ("statement_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "room_statement_line_items_booking_uidx" ON "room_statement_line_items" ("statement_id","booking_id");
