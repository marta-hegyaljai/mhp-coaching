import {readFileSync} from "node:fs";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

const drizzleDir = join(process.cwd(), "drizzle");

describe("Magie, rire & Hypnose migration", () => {
  it("inserts the published workshop without inventing sessions", () => {
    const courseSql = readFileSync(
      join(drizzleDir, "0027_magic_laughter_hypnosis.sql"),
      "utf8",
    );

    expect(courseSql).toMatch(/'magic-laughter-hypnosis'/);
    expect(courseSql).toMatch(/'workshop'/);
    expect(courseSql).toMatch(/Magie, rire & Hypnose/);
    expect(courseSql).toMatch(/\b300\b/);
    expect(courseSql).toMatch(/true,\s*19/);
    expect(courseSql).not.toMatch(/INSERT INTO "course_sessions"/);
  });
});
