import {
  clearSessionDraft,
  readSessionDraft,
  writeSessionDraft,
  type SessionDraftStorage,
} from "@/shared/session-draft";

import {readWaitlistDraft, type WaitlistFormDraft} from "./validation";

export const WAITLIST_FORM_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const WAITLIST_FORM_DRAFT_SCOPE_PREFIX = "waitlist-form:";

export type WaitlistSessionDraft = WaitlistFormDraft & {
  privacyAccepted: boolean;
};

const stringFields = ["firstName", "lastName", "email", "phone"] as const;
const stringLimits: Record<(typeof stringFields)[number], number> = {
  firstName: 80,
  lastName: 80,
  email: 160,
  phone: 40,
};

export function waitlistFormDraftScope(courseId: string): string {
  return `${WAITLIST_FORM_DRAFT_SCOPE_PREFIX}${courseId}`;
}

export function isWaitlistSessionDraft(
  value: unknown,
): value is WaitlistSessionDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.privacyAccepted !== "boolean") {
    return false;
  }

  return stringFields.every((field) => typeof record[field] === "string");
}

export function waitlistSessionDraftFromFormData(
  formData: FormData,
): WaitlistSessionDraft {
  const privacyRaw = formData.get("privacyAccepted");

  return sanitizeWaitlistSessionDraft({
    ...readWaitlistDraft(formData),
    privacyAccepted:
      privacyRaw === "on" || privacyRaw === "true" || privacyRaw === "1",
  });
}

export function readWaitlistFormDraft(
  courseId: string,
  options: {
    now?: () => number;
    storage?: SessionDraftStorage | null;
  } = {},
): WaitlistSessionDraft | null {
  const draft = readSessionDraft(
    waitlistFormDraftScope(courseId),
    isWaitlistSessionDraft,
    {
      maxAgeMs: WAITLIST_FORM_DRAFT_MAX_AGE_MS,
      ...options,
    },
  );

  return draft ? sanitizeWaitlistSessionDraft(draft) : null;
}

export function writeWaitlistFormDraft(
  courseId: string,
  draft: WaitlistSessionDraft,
  options: {
    now?: () => number;
    storage?: SessionDraftStorage | null;
  } = {},
): void {
  writeSessionDraft(
    waitlistFormDraftScope(courseId),
    sanitizeWaitlistSessionDraft(draft),
    options,
  );
}

export function clearWaitlistFormDraft(
  courseId: string,
  storage?: SessionDraftStorage | null,
): void {
  clearSessionDraft(waitlistFormDraftScope(courseId), storage);
}

function sanitizeWaitlistSessionDraft(
  draft: WaitlistSessionDraft,
): WaitlistSessionDraft {
  return {
    firstName: draft.firstName.slice(0, stringLimits.firstName),
    lastName: draft.lastName.slice(0, stringLimits.lastName),
    email: draft.email.slice(0, stringLimits.email),
    phone: draft.phone.slice(0, stringLimits.phone),
    privacyAccepted: draft.privacyAccepted,
  };
}
