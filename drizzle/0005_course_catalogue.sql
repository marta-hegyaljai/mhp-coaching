CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"slug" jsonb NOT NULL,
	"title" jsonb NOT NULL,
	"short_description" jsonb NOT NULL,
	"description" jsonb NOT NULL,
	"audience" jsonb NOT NULL,
	"duration" jsonb NOT NULL,
	"location" jsonb NOT NULL,
	"price_chf" integer NOT NULL,
	"category" "course_category" NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"display_order" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "courses_published_idx" ON "courses" ("published");
--> statement-breakpoint
CREATE INDEX "courses_display_order_idx" ON "courses" ("display_order");
--> statement-breakpoint
CREATE TABLE "course_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"location" jsonb NOT NULL,
	"venue" jsonb,
	"capacity" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"display_order" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "course_sessions_course_id_idx" ON "course_sessions" ("course_id");
