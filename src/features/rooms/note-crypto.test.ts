import {afterEach, describe, expect, it} from "vitest";

import {RoomError} from "@/features/rooms/errors";
import {decryptNote, encryptNote, readNoteEncryptionKeys} from "@/features/rooms/note-crypto";

const CURRENT =
  "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const PREVIOUS =
  "1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100";

const originalEnv = {
  ROOM_NOTE_ENCRYPTION_KEY: process.env.ROOM_NOTE_ENCRYPTION_KEY,
  ROOM_NOTE_ENCRYPTION_KEY_PREVIOUS: process.env.ROOM_NOTE_ENCRYPTION_KEY_PREVIOUS,
  ROOM_NOTE_ENCRYPTION_KEY_VERSION: process.env.ROOM_NOTE_ENCRYPTION_KEY_VERSION,
  ROOM_NOTE_ENCRYPTION_PREVIOUS_VERSION: process.env.ROOM_NOTE_ENCRYPTION_PREVIOUS_VERSION,
};

afterEach(() => {
  process.env.ROOM_NOTE_ENCRYPTION_KEY = originalEnv.ROOM_NOTE_ENCRYPTION_KEY;
  process.env.ROOM_NOTE_ENCRYPTION_KEY_PREVIOUS = originalEnv.ROOM_NOTE_ENCRYPTION_KEY_PREVIOUS;
  process.env.ROOM_NOTE_ENCRYPTION_KEY_VERSION = originalEnv.ROOM_NOTE_ENCRYPTION_KEY_VERSION;
  process.env.ROOM_NOTE_ENCRYPTION_PREVIOUS_VERSION =
    originalEnv.ROOM_NOTE_ENCRYPTION_PREVIOUS_VERSION;
});

describe("note encryption", () => {
  it("round-trips unicode text and never stores the plaintext in the payload", () => {
    const env = {ROOM_NOTE_ENCRYPTION_KEY: CURRENT};
    const secret = "Rappel 🔒 — Mme Dupont n’est pas un dossier";
    const encrypted = encryptNote(secret, env);

    expect(encrypted.ciphertext.includes(secret)).toBe(false);
    expect(encrypted.nonce.length).toBe(12);
    expect(encrypted.keyVersion).toBe(1);
    expect(decryptNote(encrypted, env)).toBe(secret);
  });

  it("rejects a missing or malformed key before writing", () => {
    expect(() => readNoteEncryptionKeys({})).toThrow(RoomError);
    try {
      readNoteEncryptionKeys({});
    } catch (error) {
      expect(error).toMatchObject({code: "noteKeyMissing"});
    }
    try {
      readNoteEncryptionKeys({ROOM_NOTE_ENCRYPTION_KEY: "too-short"});
    } catch (error) {
      expect(error).toMatchObject({code: "noteKeyInvalid"});
    }
  });

  it("decrypts a previous key version after rotation and fails a wrong current key", () => {
    const written = encryptNote("keep this", {
      ROOM_NOTE_ENCRYPTION_KEY: PREVIOUS,
        ROOM_NOTE_ENCRYPTION_KEY_VERSION: "1",
    });

    expect(
      decryptNote(written, {
        ROOM_NOTE_ENCRYPTION_KEY: CURRENT,
        ROOM_NOTE_ENCRYPTION_KEY_VERSION: "2",
        ROOM_NOTE_ENCRYPTION_KEY_PREVIOUS: PREVIOUS,
        ROOM_NOTE_ENCRYPTION_PREVIOUS_VERSION: "1",
      }),
    ).toBe("keep this");

    try {
      decryptNote(written, {
        ROOM_NOTE_ENCRYPTION_KEY: CURRENT,
        ROOM_NOTE_ENCRYPTION_KEY_VERSION: "2",
      });
      throw new Error("expected decrypt to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(RoomError);
      expect(error).toMatchObject({code: "noteDecryptFailed"});
    }
  });

  it("fails closed on a truncated ciphertext", () => {
    const env = {ROOM_NOTE_ENCRYPTION_KEY: CURRENT};
    const encrypted = encryptNote("ok", env);
    try {
      decryptNote({...encrypted, ciphertext: encrypted.ciphertext.subarray(0, 4)}, env);
      throw new Error("expected decrypt to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(RoomError);
      expect(error).toMatchObject({code: "noteDecryptFailed"});
    }
  });
});
