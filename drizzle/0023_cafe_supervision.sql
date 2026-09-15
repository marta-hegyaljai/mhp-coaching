-- Café Supervision: add the CPD / group-supervision category.
-- drizzle-kit migrate runs every pending file in one transaction, and
-- PostgreSQL cannot use ALTER TYPE ... ADD VALUE until that transaction
-- commits. Recreate the enum so 0024 can insert 'supervision' in the same
-- preview/production migrate (previews apply SQL but do not re-seed).

ALTER TYPE "course_category" RENAME TO "course_category_old";
--> statement-breakpoint
CREATE TYPE "course_category" AS ENUM('foundation', 'advanced', 'medical', 'workshop', 'supervision');
--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "category" TYPE "course_category" USING "category"::text::"course_category";
--> statement-breakpoint
DROP TYPE "course_category_old";
