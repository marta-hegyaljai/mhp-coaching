import {eq} from "drizzle-orm";

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
