import {z} from "zod";

import {isValidDateOfBirth} from "./date-of-birth";

const bookingFormSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  dateOfBirth: z.string().trim().refine(isValidDateOfBirth),
  email: z.email().max(160),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(40)
    .regex(/^[0-9+().\s-]+$/),
  street: z.string().trim().min(3).max(120),
  postalCode: z.string().trim().min(3).max(12),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(56),
  courseDateId: z.string().trim().min(1),
  privacyAccepted: z.literal(true),
  intent: z.enum(["checkout", "lead"]).default("checkout"),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export type BookingFormErrors = Partial<
  Record<keyof BookingFormValues | "form", string>
>;

export type BookingFormDraft = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  courseDateId: string;
};

/**
 * Raw, length-capped submission echoed back when validation fails so a
 * rejected form never wipes what the visitor typed.
 */
export function readBookingDraft(formData: FormData): BookingFormDraft {
  return {
    firstName: readString(formData, "firstName"),
    lastName: readString(formData, "lastName"),
    dateOfBirth: readString(formData, "dateOfBirth", 10),
    email: readString(formData, "email"),
    phone: readString(formData, "phone"),
    street: readString(formData, "street"),
    postalCode: readString(formData, "postalCode", 12),
    city: readString(formData, "city"),
    country: readString(formData, "country", 56) || "CH",
    courseDateId: readString(formData, "courseDateId"),
  };
}

function readString(formData: FormData, key: string, max = 200): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.slice(0, max) : "";
}

export function parseBookingForm(formData: FormData): {
  values?: BookingFormValues;
  errors?: BookingFormErrors;
} {
  const privacyRaw = formData.get("privacyAccepted");
  const intentRaw = formData.get("intent");
  const parsed = bookingFormSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dateOfBirth: formData.get("dateOfBirth"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    street: formData.get("street"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    country: formData.get("country"),
    courseDateId: formData.get("courseDateId"),
    privacyAccepted: privacyRaw === "on" || privacyRaw === "true" || privacyRaw === "1",
    intent: intentRaw === "lead" ? "lead" : "checkout",
  });

  if (parsed.success) {
    return {values: parsed.data};
  }

  const errors: BookingFormErrors = {};

  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) {
      errors[key as keyof BookingFormErrors] = issue.message;
    }
  }

  return {errors};
}
