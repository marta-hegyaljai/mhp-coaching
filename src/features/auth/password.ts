import {randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions} from "node:crypto";

const MIN_LENGTH = 12;
const MAX_LENGTH = 1024;
const KEYLEN = 64;
const N = 16_384;
const R = 8;
const P = 1;
const MAXMEM = 64 * 1024 * 1024;
const PREFIX = "scrypt";

function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (error, derived) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derived);
    });
  });
}

export type PasswordError =
  | "tooShort"
  | "tooLong"
  | "sameAsEmail"
  | "mismatch";

export function passwordErrors(
  password: string,
  confirmation: string,
  email: string,
): PasswordError[] {
  const errors: PasswordError[] = [];

  if (password.length < MIN_LENGTH) {
    errors.push("tooShort");
  }
  if (password.length > MAX_LENGTH) {
    errors.push("tooLong");
  }
  if (password !== confirmation) {
    errors.push("mismatch");
  }
  if (password.length > 0 && password.toLowerCase() === email.trim().toLowerCase()) {
    errors.push("sameAsEmail");
  }

  return errors;
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < MIN_LENGTH || password.length > MAX_LENGTH) {
    throw new Error("Password does not meet length requirements");
  }

  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEYLEN, {
    N,
    r: R,
    p: P,
    maxmem: MAXMEM,
  });

  return [
    PREFIX,
    String(N),
    String(R),
    String(P),
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parsed = parseStoredHash(storedHash);

  if (!parsed) {
    return false;
  }

  try {
    const derived = await scrypt(password, parsed.salt, parsed.keylen, {
      N: parsed.N,
      r: parsed.r,
      p: parsed.p,
      maxmem: MAXMEM,
    });

    if (derived.length !== parsed.hash.length) {
      return false;
    }

    return timingSafeEqual(derived, parsed.hash);
  } catch {
    return false;
  }
}

function parseStoredHash(storedHash: string): {
  N: number;
  r: number;
  p: number;
  keylen: number;
  salt: Buffer;
  hash: Buffer;
} | undefined {
  const parts = storedHash.split("$");

  if (parts.length !== 6 || parts[0] !== PREFIX) {
    return undefined;
  }

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);

  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return undefined;
  }

  if (N !== 16_384 || r !== 8 || p !== 1) {
    return undefined;
  }

  try {
    return {
      N,
      r,
      p,
      keylen: KEYLEN,
      salt: Buffer.from(parts[4], "base64url"),
      hash: Buffer.from(parts[5], "base64url"),
    };
  } catch {
    return undefined;
  }
}
