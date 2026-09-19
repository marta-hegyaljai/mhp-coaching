import {describe, expect, it} from "vitest";

import {parseInquiryReplyForm, readInquiryReplyDraft} from "./reply-validation";

function form(body: string) {
  const data = new FormData();
  data.set("body", body);
  return data;
}

describe("parseInquiryReplyForm", () => {
  it("accepts a reply of at least ten characters", () => {
    expect(parseInquiryReplyForm(form("The March dates are confirmed."))).toEqual({
      values: {body: "The March dates are confirmed."},
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parseInquiryReplyForm(form("  Yes, ASCA recognises it.  "))?.values?.body).toBe(
      "Yes, ASCA recognises it.",
    );
  });

  it("rejects an empty or too-short reply", () => {
    expect(parseInquiryReplyForm(form("")).errors).toEqual({body: "invalid"});
    expect(parseInquiryReplyForm(form("too short")).errors).toEqual({body: "invalid"});
  });
});

describe("readInquiryReplyDraft", () => {
  it("keeps the typed body so a failed send does not wipe the draft", () => {
    expect(readInquiryReplyDraft(form("Draft reply that is long enough."))).toBe(
      "Draft reply that is long enough.",
    );
  });
});
