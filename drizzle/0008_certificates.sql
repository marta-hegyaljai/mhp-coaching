CREATE TYPE "course_certificate_status" AS ENUM('ACTIVE', 'REVOKED');
--> statement-breakpoint
CREATE TABLE "course_certificate_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"bytes" bytea NOT NULL,
	"byte_size" integer NOT NULL,
	"content_type" text NOT NULL,
	CONSTRAINT "course_certificate_documents_size_check" CHECK ("byte_size" > 0 AND "byte_size" <= 10485760),
	CONSTRAINT "course_certificate_documents_bytes_match_check" CHECK (octet_length("bytes") = "byte_size"),
	CONSTRAINT "course_certificate_documents_pdf_check" CHECK ("content_type" = 'application/pdf')
);
--> statement-breakpoint
CREATE TABLE "course_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" text NOT NULL,
	"course_title" jsonb NOT NULL,
	"issued_on" date NOT NULL,
	"status" "course_certificate_status" DEFAULT 'ACTIVE' NOT NULL,
	"document_id" uuid,
	"revoked_at" timestamp with time zone,
	"revoked_by_user_id" uuid
);
--> statement-breakpoint
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_document_id_course_certificate_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."course_certificate_documents"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "course_certificates_user_id_idx" ON "course_certificates" ("user_id");
--> statement-breakpoint
CREATE INDEX "course_certificates_issued_on_idx" ON "course_certificates" ("issued_on");
--> statement-breakpoint
CREATE INDEX "course_certificates_status_idx" ON "course_certificates" ("status");
