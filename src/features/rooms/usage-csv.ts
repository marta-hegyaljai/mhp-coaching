import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {OpenMonthUsage, UsageLine, UserUsage} from "@/features/rooms/usage";

function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function row(values: Array<string | number>): string {
  return values.map(csvCell).join(",");
}

export function openMonthUserTotalsToCsv(report: OpenMonthUsage): string {
  const header = [
    "year",
    "month",
    "open",
    "userId",
    "email",
    "firstName",
    "lastName",
    "currentDiscountPercent",
    "billedMinutes",
    "billedAmountMinor",
    "billedAmountChf",
    "bookingCount",
    "currency",
  ];
  const lines = [header.join(",")];
  lines.push(
    row([
      report.year,
      report.month,
      "true",
      "",
      "TOTALS",
      "",
      "",
      "",
      report.billedMinutes,
      report.billedAmountMinor,
      formatChf(minorUnitsToFrancs(report.billedAmountMinor), "fr"),
      report.bookingCount,
      "CHF",
    ]),
  );

  for (const user of report.users) {
    lines.push(
      row([
        report.year,
        report.month,
        "true",
        user.userId,
        user.email,
        user.firstName,
        user.lastName,
        user.currentDiscountPercent,
        user.billedMinutes,
        user.billedAmountMinor,
        formatChf(minorUnitsToFrancs(user.billedAmountMinor), "fr"),
        user.bookingCount,
        "CHF",
      ]),
    );
  }

  return `${lines.join("\n")}\n`;
}

export function openMonthUserLinesToCsv(report: OpenMonthUsage, user: UserUsage): string {
  const header = [
    "year",
    "month",
    "open",
    "userId",
    "email",
    "bookingId",
    "roomName",
    "startsAt",
    "endsAt",
    "status",
    "billingOutcome",
    "durationMinutes",
    "billedMinutes",
    "snapshotDiscountPercent",
    "baseHourlyRateMinor",
    "effectiveHourlyRateMinor",
    "snapshotAmountMinor",
    "billedAmountMinor",
    "billedAmountChf",
    "currency",
  ];
  const lines = [header.join(",")];

  for (const line of user.lines) {
    lines.push(usageLineCsvRow(report, user, line));
  }

  return `${lines.join("\n")}\n`;
}

function usageLineCsvRow(report: OpenMonthUsage, user: UserUsage, line: UsageLine): string {
  return row([
    report.year,
    report.month,
    "true",
    user.userId,
    user.email,
    line.bookingId,
    line.roomName,
    line.startsAt.toISOString(),
    line.endsAt.toISOString(),
    line.status,
    line.billingOutcome,
    line.durationMinutes,
    line.billedMinutes,
    line.discountPercent,
    line.baseHourlyRateMinor,
    line.effectiveHourlyRateMinor,
    line.snapshotAmountMinor,
    line.billedAmountMinor,
    formatChf(minorUnitsToFrancs(line.billedAmountMinor), "fr"),
    line.currency,
  ]);
}
