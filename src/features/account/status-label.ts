const STATUS_KEYS = {
  PAID: "status.PAID",
  PENDING: "status.PENDING",
  LEAD: "status.LEAD",
  REFUNDED: "status.REFUNDED",
} as const;

export function registrationStatusMessageKey(
  status: string,
): (typeof STATUS_KEYS)[keyof typeof STATUS_KEYS] {
  if (status in STATUS_KEYS) {
    return STATUS_KEYS[status as keyof typeof STATUS_KEYS];
  }
  return STATUS_KEYS.PAID;
}
