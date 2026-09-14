import {z} from "zod";

import {isIsoDate} from "@/shared/ui/date-field-calendar";

import {CALL_DURATION_MINUTES} from "./constants";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const contactSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().max(160),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(40)
    .regex(/^[0-9+().\s-]+$/),
  message: z.string().trim().max(4000),
  privacyAccepted: z.literal(true),
  company: z.string().max(0).optional(),
});

const callFormSchema = contactSchema.extend({
  date: z.string().refine(isIsoDate),
  time: z.string().regex(TIME_PATTERN),
});

const inquiryFormSchema = contactSchema.extend({
  message: z.string().trim().min(10).max(4000),
});

export type CallFormValues = z.infer<typeof callFormSchema>;
export type InquiryFormValues = z.infer<typeof inquiryFormSchema>;

export type CallFormErrors = Partial<
  Record<keyof CallFormValues | "form" | "slot", string>
>;
export type InquiryFormErrors = Partial<
  Record<keyof InquiryFormValues | "form", string>
>;

export type CallFormDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  date: string;
  time: string;
};

export type InquiryFormDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};

export function readCallDraft(formData: FormData): CallFormDraft {
  return {
    firstName: readString(formData, "firstName", 80),
    lastName: readString(formData, "lastName", 80),
    email: readString(formData, "email", 160),
    phone: readString(formData, "phone", 40),
    message: readString(formData, "message", 4000),
    date: readString(formData, "date", 10),
    time: readString(formData, "time", 5),
  };
}

export function readInquiryDraft(formData: FormData): InquiryFormDraft {
  return {
    firstName: readString(formData, "firstName", 80),
    lastName: readString(formData, "lastName", 80),
    email: readString(formData, "email", 160),
    phone: readString(formData, "phone", 40),
    message: readString(formData, "message", 4000),
  };
}

function readString(formData: FormData, key: string, max: number): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.slice(0, max) : "";
}

export function parseCallForm(formData: FormData): {
  values?: CallFormValues;
  errors?: CallFormErrors;
  spam?: boolean;
} {
  if (isSpam(formData)) {
    return {spam: true};
  }

  const privacyRaw = formData.get("privacyAccepted");
  const parsed = callFormSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message") ?? "",
    date: formData.get("date"),
    time: formData.get("time"),
    privacyAccepted:
      privacyRaw === "on" || privacyRaw === "true" || privacyRaw === "1",
    company: "",
  });

  if (parsed.success) {
    const minute = timeToMinute(parsed.data.time);
    if (minute % CALL_DURATION_MINUTES !== 0) {
      return {errors: {time: "invalid"}};
    }
    return {values: parsed.data};
  }

  return {errors: collectErrors(parsed.error)};
}

export function parseInquiryForm(formData: FormData): {
  values?: InquiryFormValues;
  errors?: InquiryFormErrors;
  spam?: boolean;
} {
  if (isSpam(formData)) {
    return {spam: true};
  }

  const privacyRaw = formData.get("privacyAccepted");
  const parsed = inquiryFormSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
    privacyAccepted:
      privacyRaw === "on" || privacyRaw === "true" || privacyRaw === "1",
    company: "",
  });

  if (parsed.success) {
    return {values: parsed.data};
  }

  return {errors: collectErrors(parsed.error)};
}

function isSpam(formData: FormData): boolean {
  const honeypot = formData.get("company");
  return typeof honeypot === "string" && honeypot.trim().length > 0;
}

function collectErrors<T extends Record<string, string>>(
  error: z.ZodError,
): T {
  const errors = {} as T;
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) {
      (errors as Record<string, string>)[key] = issue.message;
    }
  }
  return errors;
}

function timeToMinute(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export type AdminHourDraft = {
  weekday: number;
  closed: boolean;
  intervals: Array<{startMinute: number; endMinute: number}>;
};

export function parseAdminHoursForm(formData: FormData): AdminHourDraft[] {
  const hours: AdminHourDraft[] = [];
  for (let weekday = 1; weekday <= 7; weekday += 1) {
    const closed = formData.get(`closed-${weekday}`) === "on";
    const countRaw = Number(formData.get(`count-${weekday}`) ?? "0");
    const count = Number.isInteger(countRaw) ? Math.max(0, Math.min(countRaw, 6)) : 0;
    const intervals: Array<{startMinute: number; endMinute: number}> = [];
    for (let index = 0; index < count; index += 1) {
      const startMinute = Number(formData.get(`start-${weekday}-${index}`));
      const endMinute = Number(formData.get(`end-${weekday}-${index}`));
      intervals.push({startMinute, endMinute});
    }
    hours.push({weekday, closed, intervals: closed ? [] : intervals});
  }
  return hours;
}
