CREATE TYPE "course_format" AS ENUM('module', 'programme');--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "format" "course_format" DEFAULT 'module' NOT NULL;--> statement-breakpoint
CREATE INDEX "courses_format_idx" ON "courses" ("format");--> statement-breakpoint
CREATE TABLE "course_programme_modules" (
	"programme_id" text NOT NULL,
	"module_id" text NOT NULL,
	"display_order" integer NOT NULL,
	CONSTRAINT "course_programme_modules_programme_id_module_id_pk" PRIMARY KEY("programme_id","module_id"),
	CONSTRAINT "course_programme_modules_programme_id_courses_id_fk" FOREIGN KEY ("programme_id") REFERENCES "courses"("id") ON DELETE cascade,
	CONSTRAINT "course_programme_modules_module_id_courses_id_fk" FOREIGN KEY ("module_id") REFERENCES "courses"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX "course_programme_modules_module_idx" ON "course_programme_modules" ("module_id");--> statement-breakpoint

-- Maître Praticien is a complete learning path, not an individual module.
UPDATE "courses" SET "format" = 'programme' WHERE "id" = 'master-practitioner';--> statement-breakpoint
INSERT INTO "course_programme_modules" ("programme_id", "module_id", "display_order")
SELECT 'master-practitioner', "module"."id", "module"."ord"
FROM (VALUES
	('anxiety-hypnosis', 0),
	('advanced-techniques', 1),
	('sport-hypnosis', 2),
	('children-hypnosis', 3),
	('addictions-hypnosis', 4),
	('illness-hypnosis', 5)
) AS "module"("id", "ord")
WHERE EXISTS (SELECT 1 FROM "courses" WHERE "courses"."id" = 'master-practitioner')
	AND EXISTS (SELECT 1 FROM "courses" WHERE "courses"."id" = "module"."id")
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Programmes close the catalogue, after every individual module.
UPDATE "courses" SET "display_order" = 3 WHERE "id" = 'solution-focused-interview';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 4 WHERE "id" = 'sport-hypnosis';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 5 WHERE "id" = 'children-hypnosis';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 6 WHERE "id" = 'addictions-hypnosis';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 7 WHERE "id" = 'illness-hypnosis';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 8 WHERE "id" = 'professional-practice-final-exam';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 9 WHERE "id" = 'transgenerational-mia';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 10 WHERE "id" = 'medical-hypnosis-m1';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 11 WHERE "id" = 'medical-hypnosis-dental-m2';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 12 WHERE "id" = 'medical-hypnosis-clinical-m2';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 13 WHERE "id" = 'medical-hypnosis-exam-m3';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 14 WHERE "id" = 'chronic-pain-hypnosis';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 15 WHERE "id" = 'birth-preparation';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 16 WHERE "id" = 'weight-loss-hypnosis';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 17 WHERE "id" = 'healthy-weight-nutrition-hypnosis';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 18 WHERE "id" = 'sensory-anchors-hypnosis';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 19 WHERE "id" = 'stripe-payment-test';--> statement-breakpoint
UPDATE "courses" SET "display_order" = 20 WHERE "id" = 'master-practitioner';
