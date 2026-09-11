import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {StatementDetail} from "@/features/rooms/statements";
import type {RoomStatement} from "@/db/schema";

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

export function statementsMonthToCsv(input: {
  year: number;
  month: number;
  rows: Array<{
    statement: RoomStatement;
    email: string;
    firstName: string;
    lastName: string;
  }>;
}): string {
  const header = [
    "year",
    "month",
    "status",
    "userId",
    "email",
    "firstName",
    "lastName",
    "billedMinutes",
    "totalMinor",
    "totalChf",
    "currency",
    "statementId",
    "finalizedAt",
  ];
  const lines = [header.join(",")];
  for (const rowValue of input.rows) {
    lines.push(
      row([
        input.year,
        input.month,
        rowValue.statement.status,
        rowValue.statement.userId,
        rowValue.email,
        rowValue.firstName,
        rowValue.lastName,
        rowValue.statement.billedMinutes,
        rowValue.statement.totalMinor,
        formatChf(minorUnitsToFrancs(rowValue.statement.totalMinor), "fr"),
        rowValue.statement.currency,
        rowValue.statement.id,
        rowValue.statement.finalizedAt?.toISOString() ?? "",
      ]),
    );
  }
  return `${lines.join("\n")}\n`;
}

export function statementDetailToCsv(detail: StatementDetail): string {
  const header = [
    "statementId",
    "year",
    "month",
    "status",
    "userId",
    "email",
    "kind",
    "description",
    "minutes",
    "amountMinor",
    "amountChf",
    "reason",
    "currency",
  ];
  const lines = [header.join(",")];
  for (const line of detail.lines) {
    lines.push(
      row([
        detail.statement.id,
        detail.statement.year,
        detail.statement.month,
        detail.statement.status,
        detail.owner.userId,
        detail.owner.email,
        line.kind,
        line.description,
        line.minutes,
        line.amountMinor,
        formatChf(minorUnitsToFrancs(line.amountMinor), "fr"),
        line.reason ?? "",
        detail.statement.currency,
      ]),
    );
  }
  lines.push(
    row([
      detail.statement.id,
      detail.statement.year,
      detail.statement.month,
      detail.statement.status,
      detail.owner.userId,
      detail.owner.email,
      "TOTAL",
      "",
      detail.statement.billedMinutes,
      detail.statement.totalMinor,
      formatChf(minorUnitsToFrancs(detail.statement.totalMinor), "fr"),
      "",
      detail.statement.currency,
    ]),
  );
  return `${lines.join("\n")}\n`;
}
