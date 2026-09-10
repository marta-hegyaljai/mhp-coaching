export function trimPersonName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidPersonName(value: string): boolean {
  const trimmed = trimPersonName(value);
  return trimmed.length >= 1 && trimmed.length <= 100;
}
