import {createCipheriv, createDecipheriv, randomBytes, timingSafeEqual} from "node:crypto";

import {RoomError} from "@/features/rooms/errors";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const NONCE_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const HEX_KEY = /^[0-9a-fA-F]{64}$/;

export type NoteKey = {
  version: number;
  key: Buffer;
};

export type EncryptedNote = {
  ciphertext: Buffer;
  nonce: Buffer;
  keyVersion: number;
};

function parseKeyMaterial(raw: string | undefined): Buffer | "missing" | "invalid" {
  const value = raw?.trim() ?? "";
  if (!value) {
    return "missing";
  }
  if (HEX_KEY.test(value)) {
    return Buffer.from(value, "hex");
  }
  try {
    const decoded = Buffer.from(value, "base64");
    if (decoded.length === KEY_BYTES) {
      return decoded;
    }
  } catch {
    return "invalid";
  }
  return "invalid";
}

function parseVersion(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const version = Number(raw);
  if (!Number.isInteger(version) || version < 1 || version > 32_767) {
    throw new RoomError("noteKeyInvalid");
  }
  return version;
}

export type NoteCryptoEnv = Record<string, string | undefined>;

export function readNoteEncryptionKeys(
  env: NoteCryptoEnv = process.env,
): {current: NoteKey; previous?: NoteKey} {
  const currentMaterial = parseKeyMaterial(env.ROOM_NOTE_ENCRYPTION_KEY);
  if (currentMaterial === "missing") {
    throw new RoomError("noteKeyMissing");
  }
  if (currentMaterial === "invalid") {
    throw new RoomError("noteKeyInvalid");
  }

  const current: NoteKey = {
    version: parseVersion(env.ROOM_NOTE_ENCRYPTION_KEY_VERSION, 1),
    key: currentMaterial,
  };

  const previousMaterial = parseKeyMaterial(env.ROOM_NOTE_ENCRYPTION_KEY_PREVIOUS);
  if (previousMaterial === "missing") {
    return {current};
  }
  if (previousMaterial === "invalid") {
    throw new RoomError("noteKeyInvalid");
  }

  const previous: NoteKey = {
    version: parseVersion(env.ROOM_NOTE_ENCRYPTION_PREVIOUS_VERSION, current.version - 1),
    key: previousMaterial,
  };
  if (previous.version < 1 || previous.version === current.version) {
    throw new RoomError("noteKeyInvalid");
  }

  return {current, previous};
}

export function encryptNote(plaintext: string, env: NoteCryptoEnv = process.env): EncryptedNote {
  const {current} = readNoteEncryptionKeys(env);
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(ALGORITHM, current.key, nonce, {authTagLength: AUTH_TAG_BYTES});
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return {ciphertext, nonce, keyVersion: current.version};
}

function keyForVersion(
  version: number,
  keys: {current: NoteKey; previous?: NoteKey},
): Buffer | undefined {
  if (keys.current.version === version) {
    return keys.current.key;
  }
  if (keys.previous?.version === version) {
    return keys.previous.key;
  }
  return undefined;
}

export function decryptNote(
  payload: EncryptedNote,
  env: NoteCryptoEnv = process.env,
): string {
  if (payload.nonce.length !== NONCE_BYTES || payload.ciphertext.length <= AUTH_TAG_BYTES) {
    throw new RoomError("noteDecryptFailed");
  }

  const keys = readNoteEncryptionKeys(env);
  const key = keyForVersion(payload.keyVersion, keys);
  if (!key) {
    throw new RoomError("noteDecryptFailed");
  }

  try {
    const encrypted = payload.ciphertext.subarray(0, payload.ciphertext.length - AUTH_TAG_BYTES);
    const authTag = payload.ciphertext.subarray(payload.ciphertext.length - AUTH_TAG_BYTES);
    const decipher = createDecipheriv(ALGORITHM, key, payload.nonce, {
      authTagLength: AUTH_TAG_BYTES,
    });
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    throw new RoomError("noteDecryptFailed");
  }
}

export function noteKeysEqual(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && timingSafeEqual(left, right);
}
