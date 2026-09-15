-- Café Supervision: add the CPD / group-supervision category. The course row
-- and visio evenings follow in 0024 so PostgreSQL can commit the new enum
-- value before it is used (drizzle-kit wraps each file in a transaction).

ALTER TYPE "course_category" ADD VALUE IF NOT EXISTS 'supervision';
