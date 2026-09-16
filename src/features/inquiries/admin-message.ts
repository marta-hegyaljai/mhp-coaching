import {callPersonName} from "@/features/course-calls/format";
import {getCourseInquiryById} from "@/features/course-calls/repository";

import {getInquiryById} from "./repository";

/** Which table the message came from, and therefore how it is read back. */
export const ADMIN_MESSAGE_CHANNELS = ["course", "contact"] as const;

export type AdminMessageChannel = (typeof ADMIN_MESSAGE_CHANNELS)[number];

/** What an admin needs to read and answer a message, whichever form sent it. */
export type AdminMessage = {
  id: string;
  channel: AdminMessageChannel;
  topic: "course" | "general" | "payment";
  receivedAt: Date;
  name: string;
  email: string;
  phone: string | null;
  courseTitle: string | null;
  message: string;
};

export function parseAdminMessageChannel(
  value: string | string[] | undefined,
): AdminMessageChannel {
  const raw = Array.isArray(value) ? value[0] : value;

  return raw === "contact" ? "contact" : "course";
}

/**
 * Written course questions and contact/payment-help messages are one inbox for
 * the admin, so both resolve through a single lookup.
 */
export async function findAdminMessage(
  id: string,
  channel: AdminMessageChannel,
): Promise<AdminMessage | undefined> {
  if (channel === "contact") {
    const row = await getInquiryById(id);
    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      channel: "contact",
      // The stored kind is free text; anything unexpected reads as general.
      topic: row.kind === "payment" ? "payment" : "general",
      receivedAt: row.createdAt,
      name: row.name.trim() || row.email,
      email: row.email,
      phone: row.phone?.trim() || null,
      courseTitle: row.courseTitle,
      message: row.message,
    };
  }

  const row = await getCourseInquiryById(id);
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    channel: "course",
    topic: "course",
    receivedAt: row.createdAt,
    name: callPersonName(row.firstName, row.lastName) || row.email,
    email: row.email,
    phone: row.phone.trim() || null,
    courseTitle: row.courseTitle,
    message: row.message,
  };
}
