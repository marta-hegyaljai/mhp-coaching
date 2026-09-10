export const USERS_EMAIL_NORMALIZED_UNIQUE = "users_email_normalized_unique";

export class UniqueEmailError extends Error {
  constructor() {
    super("A user with this email already exists.");
    this.name = "UniqueEmailError";
  }
}

type NestedError = {
  code?: unknown;
  constraint?: unknown;
  cause?: unknown;
};

export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object") {
      return false;
    }

    const candidate = current as NestedError;
    if (candidate.code === "23505") {
      if (!constraint) {
        return true;
      }
      if (candidate.constraint === constraint) {
        return true;
      }
    }

    current = candidate.cause;
  }

  return false;
}
