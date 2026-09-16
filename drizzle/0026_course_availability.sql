CREATE TYPE "course_availability" AS ENUM('auto', 'available', 'full', 'dates_pending', 'registration_closed');
--> statement-breakpoint
CREATE TYPE "session_availability" AS ENUM('auto', 'available', 'full', 'registration_closed');
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "availability" "course_availability" DEFAULT 'auto' NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_sessions" ADD COLUMN "availability" "session_availability" DEFAULT 'auto' NOT NULL;
