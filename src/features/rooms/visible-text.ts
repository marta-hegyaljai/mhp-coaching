import type {RoomErrorCode} from "@/features/rooms/errors";
import {RoomError} from "@/features/rooms/errors";

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export function sanitizeVisibleText(
  value: string,
  maxLength: number,
  code: Extract<RoomErrorCode, "invalidNote" | "invalidMessage" | "invalidAdminNote">,
  {allowEmpty = false}: {allowEmpty?: boolean} = {},
): string {
  const normalized = value.normalize("NFC").replace(/\r\n/g, "\n");
  if (CONTROL.test(normalized)) {
    throw new RoomError(code);
  }
  const trimmed = normalized.trim();
  if (trimmed.length > maxLength) {
    throw new RoomError(code);
  }
  if (!allowEmpty && trimmed.length === 0) {
    throw new RoomError(code);
  }
  return trimmed;
}
