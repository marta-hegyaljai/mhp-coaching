import type {Booking, CourseInquiry, Inquiry, InquiryReply} from "@/db/schema";
import {callPersonName} from "@/features/course-calls/format";
import {listAdminInquiries, getCourseInquiryById} from "@/features/course-calls/repository";
import type {PathnameHref} from "@/i18n/href";

import {listInquiryReplies, listLatestReplyAt} from "./replies";
import {
  getInquiryById,
  getLeadBookingById,
  listAdminContactInquiries,
  listAdminLeadBookings,
} from "./repository";

/** Which table the message came from, and therefore how it is read back. */
export const ADMIN_MESSAGE_CHANNELS = ["course", "contact", "lead"] as const;

export type AdminMessageChannel = (typeof ADMIN_MESSAGE_CHANNELS)[number];

export type AdminMessageReply = {
  id: string;
  createdAt: Date;
  body: string;
  toEmail: string;
};

/** What an admin needs to read and answer a message, whichever form sent it. */
export type AdminMessage = {
  id: string;
  channel: AdminMessageChannel;
  topic: "course" | "general" | "payment";
  receivedAt: Date;
  name: string;
  greetingName: string;
  email: string;
  phone: string | null;
  courseTitle: string | null;
  message: string;
  locale: string;
  replies: AdminMessageReply[];
};

export type AdminMessageListItem = Omit<AdminMessage, "replies" | "message"> & {
  excerpt: string;
  repliedAt: Date | null;
};

export function parseAdminMessageChannel(
  value: string | string[] | undefined,
): AdminMessageChannel {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === "contact" || raw === "lead") {
    return raw;
  }

  return "course";
}

export function adminMessageHref(
  id: string,
  channel: AdminMessageChannel,
): PathnameHref {
  return {
    pathname: "/admin/calls/messages/[id]",
    params: {id},
    query: channel === "course" ? undefined : {channel},
  };
}

function greetingNameFromFullName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function contactTopic(kind: string): "general" | "payment" {
  return kind === "payment" ? "payment" : "general";
}

function toReplyView(row: InquiryReply): AdminMessageReply {
  return {
    id: row.id,
    createdAt: row.createdAt,
    body: row.body,
    toEmail: row.toEmail,
  };
}

function fromCourseInquiry(row: CourseInquiry): Omit<AdminMessage, "replies"> {
  const name = callPersonName(row.firstName, row.lastName) || row.email;

  return {
    id: row.id,
    channel: "course",
    topic: "course",
    receivedAt: row.createdAt,
    name,
    greetingName: row.firstName.trim() || greetingNameFromFullName(name),
    email: row.email,
    phone: row.phone.trim() || null,
    courseTitle: row.courseTitle,
    message: row.message,
    locale: row.locale,
  };
}

function fromContactInquiry(row: Inquiry): Omit<AdminMessage, "replies"> {
  const name = row.name.trim() || row.email;

  return {
    id: row.id,
    channel: "contact",
    topic: contactTopic(row.kind),
    receivedAt: row.createdAt,
    name,
    greetingName: greetingNameFromFullName(name) || name,
    email: row.email,
    phone: row.phone?.trim() || null,
    courseTitle: row.courseTitle,
    message: row.message,
    locale: row.locale,
  };
}

function fromLeadBooking(row: Booking): Omit<AdminMessage, "replies"> {
  const name = callPersonName(row.firstName, row.lastName) || row.email;

  return {
    id: row.id,
    channel: "lead",
    topic: "payment",
    receivedAt: row.createdAt,
    name,
    greetingName: row.firstName.trim() || greetingNameFromFullName(name),
    email: row.email,
    phone: row.phone.trim() || null,
    courseTitle: row.courseTitle,
    message: "",
    locale: row.locale,
  };
}

/**
 * Written course questions and contact/payment-help messages are one inbox for
 * the admin, so both resolve through a single lookup.
 */
export async function findAdminMessage(
  id: string,
  channel: AdminMessageChannel,
): Promise<AdminMessage | undefined> {
  const message =
    channel === "contact"
      ? await loadContactMessage(id)
      : channel === "lead"
        ? await loadLeadMessage(id)
        : await loadCourseMessage(id);
  if (!message) {
    return undefined;
  }

  const replies = await listInquiryReplies(message.channel, message.id);
  return {...message, replies: replies.map(toReplyView)};
}

async function loadContactMessage(id: string) {
  const row = await getInquiryById(id);
  return row ? fromContactInquiry(row) : undefined;
}

async function loadCourseMessage(id: string) {
  const row = await getCourseInquiryById(id);
  return row ? fromCourseInquiry(row) : undefined;
}

async function loadLeadMessage(id: string) {
  const row = await getLeadBookingById(id);
  return row ? fromLeadBooking(row) : undefined;
}

/**
 * Newest first across both inbound tables, then sliced for the messages tab.
 * Each source is read far enough that a later page still sees the merged order.
 */
export async function listAdminMessages(input: {
  q?: string;
  limit: number;
  offset: number;
}): Promise<{rows: AdminMessageListItem[]; total: number}> {
  const take = input.offset + input.limit;
  const [course, contact, lead] = await Promise.all([
    listAdminInquiries({q: input.q, limit: take, offset: 0}),
    listAdminContactInquiries({q: input.q, limit: take, offset: 0}),
    listAdminLeadBookings({q: input.q, limit: take, offset: 0}),
  ]);

  const [courseReplied, contactReplied, leadReplied] = await Promise.all([
    listLatestReplyAt(
      "course",
      course.rows.map((row) => row.id),
    ),
    listLatestReplyAt(
      "contact",
      contact.rows.map((row) => row.id),
    ),
    listLatestReplyAt(
      "lead",
      lead.rows.map((row) => row.id),
    ),
  ]);

  const merged: AdminMessageListItem[] = [
    ...course.rows.map((row) => toListItem(fromCourseInquiry(row), courseReplied.get(row.id))),
    ...contact.rows.map((row) => toListItem(fromContactInquiry(row), contactReplied.get(row.id))),
    ...lead.rows.map((row) => toListItem(fromLeadBooking(row), leadReplied.get(row.id))),
  ].sort((left, right) => {
    const delta = right.receivedAt.getTime() - left.receivedAt.getTime();
    return delta !== 0 ? delta : right.id.localeCompare(left.id);
  });

  return {
    rows: merged.slice(input.offset, input.offset + input.limit),
    total: course.total + contact.total + lead.total,
  };
}

function listExcerpt(value: string): string {
  const collapsed = value.replaceAll(/\s+/g, " ").trim();
  return collapsed.length > 140
    ? `${collapsed.slice(0, 139).trimEnd()}…`
    : collapsed;
}

function toListItem(
  message: Omit<AdminMessage, "replies">,
  repliedAt: Date | undefined,
): AdminMessageListItem {
  const {message: body, ...rest} = message;
  return {
    ...rest,
    excerpt: listExcerpt(body),
    repliedAt: repliedAt ?? null,
  };
}
