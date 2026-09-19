import {z} from "zod";

export const INQUIRY_REPLY_MIN = 10;
export const INQUIRY_REPLY_MAX = 4000;

const replySchema = z.object({
  body: z.string().trim().min(INQUIRY_REPLY_MIN).max(INQUIRY_REPLY_MAX),
});

export type InquiryReplyValues = z.infer<typeof replySchema>;

export type InquiryReplyErrors = Partial<Record<"body" | "form", string>>;

export function readInquiryReplyDraft(formData: FormData): string {
  const value = formData.get("body");
  return typeof value === "string" ? value.slice(0, INQUIRY_REPLY_MAX) : "";
}

export function parseInquiryReplyForm(formData: FormData): {
  values?: InquiryReplyValues;
  errors?: InquiryReplyErrors;
} {
  const parsed = replySchema.safeParse({
    body: formData.get("body"),
  });

  if (parsed.success) {
    return {values: parsed.data};
  }

  return {errors: {body: "invalid"}};
}
