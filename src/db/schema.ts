import {integer, pgTable, timestamp} from "drizzle-orm/pg-core";

// A deliberately minimal table proving that generated migrations and the local
// PostgreSQL connection work. Product tables arrive with their own feature work.
export const bootstrapChecks = pgTable("bootstrap_checks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp("created_at", {withTimezone: true})
    .defaultNow()
    .notNull(),
});
