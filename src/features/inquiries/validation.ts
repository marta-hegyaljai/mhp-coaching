import {z} from "zod";

const inquiryFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(160),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^$|^[0-9+().\s-]+$/),
  message: z.string().trim().min(10).max(4000),
  company: z.string().max(0).optional(),
});

export type InquiryFormValues = z.infer<typeof inquiryFormSchema>;

export type InquiryFormErrors = Partial<
  Record<keyof InquiryFormValues | "form", string>
>;

export type InquiryFormDraft = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export function readInquiryDraft(formData: FormData): InquiryFormDraft {
  return {
    name: readString(formData, "name", 120),
    email: readString(formData, "email", 160),
    phone: readString(formData, "phone", 40),
    message: readString(formData, "message", 4000),
  };
}

function readString(formData: FormData, key: string, max: number): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.slice(0, max) : "";
}

export function parseInquiryForm(formData: FormData): {
  values?: InquiryFormValues;
  errors?: InquiryFormErrors;
  spam?: boolean;
} {
  const honeypot = formData.get("company");
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return {spam: true};
  }

  const parsed = inquiryFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    message: formData.get("message"),
    company: "",
  });

  if (parsed.success) {
    return {values: parsed.data};
  }

  const errors: InquiryFormErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) {
      errors[key as keyof InquiryFormErrors] = issue.message;
    }
  }

  return {errors};
}
