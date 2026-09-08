export function reduceBookingStatus(
  current: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED",
  event: "paid" | "cancelled" | "failed",
): {next: typeof current; apply: boolean} {
  if (current === "PAID") {
    return {next: "PAID", apply: false};
  }

  if (event === "paid") {
    return {next: "PAID", apply: true};
  }

  if (event === "failed") {
    return {next: "FAILED", apply: true};
  }

  return {next: "CANCELLED", apply: true};
}
