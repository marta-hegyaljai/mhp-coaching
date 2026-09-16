ALTER TABLE "waitlist_entries" ADD COLUMN "course_session_id" text;
--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD COLUMN "notified_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "waitlist_entries" DROP CONSTRAINT "waitlist_entries_course_email_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_entries_course_email_session_uidx" ON "waitlist_entries" USING btree ("course_id","email","course_session_id") WHERE "course_session_id" is not null;
--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_entries_course_email_course_uidx" ON "waitlist_entries" USING btree ("course_id","email") WHERE "course_session_id" is null;
