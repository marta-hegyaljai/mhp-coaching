CREATE TABLE "ops_heartbeats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"job" text NOT NULL,
	"ok" boolean NOT NULL,
	"payload" jsonb NOT NULL,
	"error" text,
	CONSTRAINT "ops_heartbeats_job_check" CHECK (char_length("job") > 0)
);
--> statement-breakpoint
CREATE INDEX "ops_heartbeats_job_created_at_idx" ON "ops_heartbeats" ("job","created_at");
