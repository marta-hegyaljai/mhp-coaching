import {getDb} from "@/db";
import {inquiries, type Inquiry, type NewInquiry} from "@/db/schema";

export async function createInquiry(input: NewInquiry): Promise<Inquiry> {
  const [inquiry] = await getDb().insert(inquiries).values(input).returning();
  return inquiry;
}
