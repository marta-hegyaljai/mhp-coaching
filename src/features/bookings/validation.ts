import {z} from "zod";

const bookingFormSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().max(160),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(40)
    .regex(/^[0-9+().\s-]+$/),
  courseDateId: z.string().trim().min(1),
  privacyAccepted: z.literal(true),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export type BookingFormErrors = Partial<
  Record<keyof BookingFormValues | "form", string>
>;

export type BookingFormDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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
    email: readString(formData, "email"),
    phone: readString(formData, "phone"),
    courseDateId: readString(formData, "courseDateId"),
  };
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.slice(0, 200) : "";
}

export function parseBookingForm(formData: FormData): {
  values?: BookingFormValues;
  errors?: BookingFormErrors;
} {
  const privacyRaw = formData.get("privacyAccepted");
  const parsed = bookingFormSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    courseDateId: formData.get("courseDateId"),
    privacyAccepted: privacyRaw === "on" || privacyRaw === "true" || privacyRaw === "1",
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
