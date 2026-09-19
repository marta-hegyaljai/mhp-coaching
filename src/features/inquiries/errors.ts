export type InquiryReplyErrorCode =
  | "forbidden"
  | "notFound"
  | "invalidBody"
  | "sendFailed";

export class InquiryReplyError extends Error {
  constructor(public readonly code: InquiryReplyErrorCode) {
    super(code);
    this.name = "InquiryReplyError";
  }
}
