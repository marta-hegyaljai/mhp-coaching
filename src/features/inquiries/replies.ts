import {and, asc, eq, inArray, sql} from "drizzle-orm";

import {getDb} from "@/db";
import {
  inquiryReplies,
  type InquiryReply,
  type InquiryReplyChannel,
  type NewInquiryReply,
} from "@/db/schema";

export async function insertInquiryReply(input: NewInquiryReply): Promise<InquiryReply> {
  const [row] = await getDb().insert(inquiryReplies).values(input).returning();
  return row;
}

export async function listInquiryReplies(
  channel: InquiryReplyChannel,
  inquiryId: string,
): Promise<InquiryReply[]> {
  return getDb()
    .select()
    .from(inquiryReplies)
    .where(
      and(eq(inquiryReplies.channel, channel), eq(inquiryReplies.inquiryId, inquiryId)),
    )
    .orderBy(asc(inquiryReplies.createdAt), asc(inquiryReplies.id));
}

/**
 * Latest send time per inbound message. Used by the inbox and control panel
 * so unanswered rows stay gold and answered rows read as healthy.
 */
export async function listLatestReplyAt(
  channel: InquiryReplyChannel,
  inquiryIds: string[],
): Promise<Map<string, Date>> {
  const latest = new Map<string, Date>();
  if (inquiryIds.length === 0) {
    return latest;
  }

  const rows = await getDb()
    .select({
      inquiryId: inquiryReplies.inquiryId,
      createdAt: sql<Date>`max(${inquiryReplies.createdAt})`.as("created_at"),
    })
    .from(inquiryReplies)
    .where(
      and(
        eq(inquiryReplies.channel, channel),
        inArray(inquiryReplies.inquiryId, inquiryIds),
      ),
    )
    .groupBy(inquiryReplies.inquiryId);

  for (const row of rows) {
    latest.set(row.inquiryId, row.createdAt);
  }
  return latest;
}
