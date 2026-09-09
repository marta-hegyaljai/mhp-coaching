import {z} from "zod";

const waitlistFormSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().max(160),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(40)
    .regex(/^[0-9+().\s-]+$/),
  privacyAccepted: z.literal(true),
  company: z.string().max(0).optional(),
});

export type WaitlistFormValues = z.infer<typeof waitlistFormSchema>;

export type WaitlistFormErrors = Partial<
  Record<"firstName" | "lastName" | "email" | "phone" | "privacyAccepted" | "form", string>
>;

export type WaitlistFormDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export function readWaitlistDraft(formData: FormData): WaitlistFormDraft {
  return {
    firstName: readString(formData, "firstName", 80),
    lastName: readString(formData, "lastName", 80),
    email: readString(formData, "email", 160),
    phone: readString(formData, "phone", 40),
  };
}

function readString(formData: FormData, key: string, max: number): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.slice(0, max) : "";
}

export function parseWaitlistForm(formData: FormData): {
  values?: WaitlistFormValues;
  errors?: WaitlistFormErrors;
  spam?: boolean;
} {
  const honeypot = formData.get("company");
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return {spam: true};
  }

  const privacyRaw = formData.get("privacyAccepted");
  const parsed = waitlistFormSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    privacyAccepted:
      privacyRaw === "on" || privacyRaw === "true" || privacyRaw === "1",
    company: "",
  });

  if (parsed.success) {
    return {values: parsed.data};
  }

  const errors: WaitlistFormErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) {
      errors[key as keyof WaitlistFormErrors] = issue.message;
    }
  }

  return {errors};
}
