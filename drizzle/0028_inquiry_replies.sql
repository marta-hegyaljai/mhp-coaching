CREATE TYPE "public"."inquiry_reply_channel" AS ENUM('course', 'contact');
--> statement-breakpoint
CREATE TABLE "inquiry_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"channel" "inquiry_reply_channel" NOT NULL,
	"inquiry_id" uuid NOT NULL,
	"sent_by_user_id" uuid NOT NULL,
	"to_email" text NOT NULL,
	"body" text NOT NULL,
	"locale" text NOT NULL,
	"provider" text NOT NULL,
	"provider_message_id" text
);
--> statement-breakpoint
ALTER TABLE "inquiry_replies" ADD CONSTRAINT "inquiry_replies_sent_by_user_id_users_id_fk" FOREIGN KEY ("sent_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "inquiry_replies_inquiry_idx" ON "inquiry_replies" ("channel","inquiry_id");
--> statement-breakpoint
CREATE INDEX "inquiry_replies_created_at_idx" ON "inquiry_replies" ("created_at");
