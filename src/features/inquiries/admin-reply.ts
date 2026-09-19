import type {User} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAdminister} from "@/features/auth/policy";
import {recordAudit} from "@/features/auth/repository";
import {sendInquiryReply} from "@/features/email/inquiry-reply";
import {PreviewMailBlockedError} from "@/features/email/transport";

import {findAdminMessage, type AdminMessageChannel} from "./admin-message";
import {InquiryReplyError} from "./errors";
import {insertInquiryReply} from "./replies";

export async function replyToInquiry(input: {
  actor: User;
  inquiryId: string;
  channel: AdminMessageChannel;
  body: string;
}): Promise<void> {
  if (!canAdminister(input.actor)) {
    throw new InquiryReplyError("forbidden");
  }

  const message = await findAdminMessage(input.inquiryId, input.channel);
  if (!message) {
    throw new InquiryReplyError("notFound");
  }

  let delivery;
  try {
    delivery = await sendInquiryReply({
      to: message.email,
      locale: message.locale,
      greetingName: message.greetingName,
      courseTitle: message.courseTitle,
      originalMessage: message.message,
      body: input.body,
    });
  } catch (error) {
    if (error instanceof PreviewMailBlockedError) {
      throw new InquiryReplyError("sendFailed");
    }
    console.error("Failed to send inquiry reply", error);
    throw new InquiryReplyError("sendFailed");
  }

  await insertInquiryReply({
    channel: message.channel,
    inquiryId: message.id,
    sentByUserId: input.actor.id,
    toEmail: message.email,
    body: input.body,
    locale: message.locale,
    provider: delivery.provider,
    providerMessageId: delivery.messageId,
  });

  await recordAudit({
    actorUserId: input.actor.id,
    action: AUDIT_ACTIONS.INQUIRY_REPLY_SENT,
    after: {
      channel: message.channel,
      inquiryId: message.id,
      email: message.email,
    },
  });
}
