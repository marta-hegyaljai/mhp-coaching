import {readFileSync} from "node:fs";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

const drizzleDir = join(process.cwd(), "drizzle");

describe("Café Supervision migrations", () => {
  it("recreates course_category so supervision is usable in the same migrate transaction", () => {
    const enumSql = readFileSync(
      join(drizzleDir, "0023_cafe_supervision.sql"),
      "utf8",
    );
    const courseSql = readFileSync(
      join(drizzleDir, "0024_cafe_supervision_course.sql"),
      "utf8",
    );

    const enumStatements = enumSql
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");

    expect(enumStatements).not.toMatch(/ADD VALUE/);
    expect(enumSql).toMatch(
      /CREATE TYPE "course_category" AS ENUM\('foundation', 'advanced', 'medical', 'workshop', 'supervision'\)/,
    );
    expect(enumSql).toContain(
      `ALTER TABLE "courses" ALTER COLUMN "category" TYPE "course_category" USING "category"::text::"course_category"`,
    );
    expect(courseSql).toMatch(/'cafe-supervision'/);
    expect(courseSql).toMatch(/'supervision'/);
  });
});
