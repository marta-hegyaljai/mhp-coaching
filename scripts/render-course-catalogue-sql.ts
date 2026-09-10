import {writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

import {courses} from "../src/features/courses/catalog";
import {isCoursePublished} from "../src/features/courses/types";

function jsonLiteral(value: unknown): string {
  return `$json$${JSON.stringify(value)}$json$::jsonb`;
}

function sqlString(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "NULL";
  }
  return `'${value.replaceAll("'", "''")}'`;
}

const courseValues = courses.map((course, displayOrder) => {
  return `(${[
    sqlString(course.id),
    jsonLiteral(course.slug),
    jsonLiteral(course.title),
    jsonLiteral(course.shortDescription),
    jsonLiteral(course.description),
    jsonLiteral(course.audience),
    jsonLiteral(course.duration),
    jsonLiteral(course.location),
    String(course.priceChf),
    sqlString(course.category),
    isCoursePublished(course) ? "true" : "false",
    String(displayOrder),
  ].join(", ")})`;
});

const sessionValues = courses.flatMap((course) =>
  course.dates.map((date, displayOrder) => {
    return `(${[
      sqlString(date.id),
      sqlString(course.id),
      sqlString(date.startDate),
      date.endDate ? sqlString(date.endDate) : "NULL",
      jsonLiteral(date.location),
      date.venue ? jsonLiteral(date.venue) : "NULL",
      String(date.capacity),
      date.active ? "true" : "false",
      String(displayOrder),
    ].join(", ")})`;
  }),
);

const sql = `INSERT INTO "courses" (
  "id",
  "slug",
  "title",
  "short_description",
  "description",
  "audience",
  "duration",
  "location",
  "price_chf",
  "category",
  "published",
  "display_order"
) VALUES
${courseValues.join(",\n")}
ON CONFLICT ("id") DO UPDATE SET
  "slug" = EXCLUDED."slug",
  "title" = EXCLUDED."title",
  "short_description" = EXCLUDED."short_description",
  "description" = EXCLUDED."description",
  "audience" = EXCLUDED."audience",
  "duration" = EXCLUDED."duration",
  "location" = EXCLUDED."location",
  "price_chf" = EXCLUDED."price_chf",
  "category" = EXCLUDED."category",
  "published" = EXCLUDED."published",
  "display_order" = EXCLUDED."display_order",
  "updated_at" = now();
--> statement-breakpoint
INSERT INTO "course_sessions" (
  "id",
  "course_id",
  "start_date",
  "end_date",
  "location",
  "venue",
  "capacity",
  "active",
  "display_order"
) VALUES
${sessionValues.join(",\n")}
ON CONFLICT ("id") DO UPDATE SET
  "course_id" = EXCLUDED."course_id",
  "start_date" = EXCLUDED."start_date",
  "end_date" = EXCLUDED."end_date",
  "location" = EXCLUDED."location",
  "venue" = EXCLUDED."venue",
  "capacity" = EXCLUDED."capacity",
  "active" = EXCLUDED."active",
  "display_order" = EXCLUDED."display_order";
`;

const target = fileURLToPath(new URL("../drizzle/0006_course_catalogue_data.sql", import.meta.url));
writeFileSync(target, `${sql.trim()}\n`);
console.log(`Wrote ${courses.length} courses to ${target}`);
