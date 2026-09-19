import {desc, eq, sql} from "drizzle-orm";

import {getDb} from "@/db";
import {inquiries, type Inquiry, type NewInquiry} from "@/db/schema";

export async function createInquiry(input: NewInquiry): Promise<Inquiry> {
  const [inquiry] = await getDb().insert(inquiries).values(input).returning();
  return inquiry;
}

export async function getInquiryById(id: string): Promise<Inquiry | undefined> {
  const [inquiry] = await getDb()
    .select()
    .from(inquiries)
    .where(eq(inquiries.id, id))
    .limit(1);

  return inquiry;
}

export async function listAdminContactInquiries(input: {
  q?: string;
  limit: number;
  offset: number;
}): Promise<{rows: Inquiry[]; total: number}> {
  const where = input.q
    ? sql`(
        ${inquiries.name} ILIKE ${`%${escapeLike(input.q)}%`}
        OR ${inquiries.email} ILIKE ${`%${escapeLike(input.q)}%`}
        OR COALESCE(${inquiries.phone}, '') ILIKE ${`%${escapeLike(input.q)}%`}
        OR ${inquiries.message} ILIKE ${`%${escapeLike(input.q)}%`}
        OR COALESCE(${inquiries.courseTitle}, '') ILIKE ${`%${escapeLike(input.q)}%`}
      )`
    : undefined;
  const db = getDb();
  const [countRow] = await db
    .select({total: sql<number>`count(*)::int`})
    .from(inquiries)
    .where(where);
  const rows = await db
    .select()
    .from(inquiries)
    .where(where)
    .orderBy(desc(inquiries.createdAt), desc(inquiries.id))
    .limit(input.limit)
    .offset(input.offset);
  return {rows, total: countRow?.total ?? 0};
}

function escapeLike(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}
