const FORBIDDEN_JSON_KEYS = [
  "note",
  "notes",
  "privateNote",
  "private_note",
  "ciphertext",
  "nonce",
] as const;

/**
 * Structural guard for every ordinary room payload. A private note must never
 * appear as a field or as plaintext inside calendar, admin, billing, export,
 * email or log serializations.
 */
export function assertNoPrivateNoteMaterial(
  value: unknown,
  secret = "",
  extraForbiddenKeys: string[] = [],
): void {
  let encoded: string;
  try {
    encoded = JSON.stringify(value) ?? "";
  } catch {
    throw new Error("Room payload could not be inspected for private-note leakage");
  }

  if (secret && encoded.includes(secret)) {
    throw new Error("Room payload leaked private-note plaintext");
  }

  for (const key of [...FORBIDDEN_JSON_KEYS, ...extraForbiddenKeys]) {
    if (encoded.includes(`"${key}"`)) {
      throw new Error(`Room payload leaked ${key}`);
    }
  }
}

export function assertLogHasNoPrivateNote(
  sink: Array<unknown[]>,
  secret: string,
): void {
  for (const args of sink) {
    assertNoPrivateNoteMaterial(args, secret);
  }
}
