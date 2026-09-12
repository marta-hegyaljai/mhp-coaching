import ExcelJS from "exceljs";

import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import type {StatementDetail} from "@/features/rooms/statements";
import type {MonthUsage, UsageLine, UserUsage} from "@/features/rooms/usage";
import type {RoomStatement} from "@/db/schema";

function styleHeader(row: ExcelJS.Row): void {
  row.font = {bold: true, name: "Calibri", size: 11};
  row.alignment = {vertical: "middle"};
  row.height = 22;
}

function money(minor: number): number {
  return minorUnitsToFrancs(minor);
}

async function toBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  const data = await workbook.xlsx.writeBuffer();
  return Buffer.from(data);
}

function addTitle(sheet: ExcelJS.Worksheet, title: string, period: string): void {
  sheet.mergeCells("A1:H1");
  sheet.getCell("A1").value = title;
  sheet.getCell("A1").font = {bold: true, name: "Calibri", size: 16};
  sheet.mergeCells("A2:H2");
  sheet.getCell("A2").value = period;
  sheet.getCell("A2").font = {name: "Calibri", size: 11};
  sheet.getRow(3).height = 8;
}

export async function monthUserTotalsToXlsx(report: MonthUsage): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "mhp-coaching";
  const summary = workbook.addWorksheet("Summary", {views: [{state: "frozen", ySplit: 5}]});
  const period = report.singleMonth
    ? report.fromKey
    : `${report.fromKey} – ${report.toKey}`;
  addTitle(summary, "Room usage totals", period);
  summary.getRow(4).values = [
    "From",
    "To",
    "Open month",
    "Billed minutes",
    "Billed amount (CHF)",
    "Bookings",
    "Currency",
  ];
  styleHeader(summary.getRow(4));
  summary.addRow([
    report.fromKey,
    report.toKey,
    report.open ? "Yes" : "No",
    report.billedMinutes,
    money(report.billedAmountMinor),
    report.bookingCount,
    "CHF",
  ]);
  summary.getColumn(5).numFmt = '#,##0.00';

  const users = workbook.addWorksheet("Therapists", {views: [{state: "frozen", ySplit: 1}]});
  users.columns = [
    {header: "From", key: "from", width: 12},
    {header: "To", key: "to", width: 12},
    {header: "Email", key: "email", width: 32},
    {header: "First name", key: "firstName", width: 16},
    {header: "Last name", key: "lastName", width: 16},
    {header: "Current discount %", key: "discount", width: 18},
    {header: "Billed minutes", key: "minutes", width: 16},
    {header: "Billed amount (CHF)", key: "amount", width: 20},
    {header: "Bookings", key: "count", width: 12},
    {header: "Currency", key: "currency", width: 12},
  ];
  styleHeader(users.getRow(1));
  users.getColumn("amount").numFmt = '#,##0.00';
  for (const user of report.users) {
    users.addRow({
      from: report.fromKey,
      to: report.toKey,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      discount: user.currentDiscountPercent,
      minutes: user.billedMinutes,
      amount: money(user.billedAmountMinor),
      count: user.bookingCount,
      currency: "CHF",
    });
  }

  const lines = workbook.addWorksheet("Line items", {views: [{state: "frozen", ySplit: 1}]});
  addUsageLineSheet(lines, report, report.users.flatMap((user) =>
    user.lines.map((line) => ({user, line})),
  ));

  return toBuffer(workbook);
}

export async function monthUserLinesToXlsx(report: MonthUsage, user: UserUsage): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "mhp-coaching";
  const sheet = workbook.addWorksheet("Usage", {views: [{state: "frozen", ySplit: 1}]});
  addUsageLineSheet(sheet, report, user.lines.map((line) => ({user, line})));
  return toBuffer(workbook);
}

function addUsageLineSheet(
  sheet: ExcelJS.Worksheet,
  report: MonthUsage,
  rows: Array<{user: UserUsage; line: UsageLine}>,
): void {
  sheet.columns = [
    {header: "From", key: "from", width: 12},
    {header: "To", key: "to", width: 12},
    {header: "Email", key: "email", width: 32},
    {header: "Room", key: "room", width: 22},
    {header: "Starts", key: "starts", width: 22},
    {header: "Ends", key: "ends", width: 22},
    {header: "Status", key: "status", width: 14},
    {header: "Billing", key: "billing", width: 18},
    {header: "Duration (min)", key: "duration", width: 16},
    {header: "Billed minutes", key: "minutes", width: 16},
    {header: "Discount %", key: "discount", width: 14},
    {header: "Hourly rate (CHF)", key: "rate", width: 18},
    {header: "Effective rate (CHF)", key: "effective", width: 20},
    {header: "Billed amount (CHF)", key: "amount", width: 20},
    {header: "Currency", key: "currency", width: 12},
  ];
  styleHeader(sheet.getRow(1));
  sheet.getColumn("rate").numFmt = '#,##0.00';
  sheet.getColumn("effective").numFmt = '#,##0.00';
  sheet.getColumn("amount").numFmt = '#,##0.00';
  for (const {user, line} of rows) {
    sheet.addRow({
      from: report.fromKey,
      to: report.toKey,
      email: user.email,
      room: line.roomName,
      starts: line.startsAt,
      ends: line.endsAt,
      status: line.status,
      billing: line.billingOutcome,
      duration: line.durationMinutes,
      minutes: line.billedMinutes,
      discount: line.discountPercent,
      rate: money(line.baseHourlyRateMinor),
      effective: money(line.effectiveHourlyRateMinor),
      amount: money(line.billedAmountMinor),
      currency: line.currency,
    });
  }
}

export async function statementsMonthToXlsx(input: {
  fromKey: string;
  toKey: string;
  rows: Array<{
    statement: RoomStatement;
    email: string;
    firstName: string;
    lastName: string;
  }>;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "mhp-coaching";
  const sheet = workbook.addWorksheet("Statements", {views: [{state: "frozen", ySplit: 1}]});
  sheet.columns = [
    {header: "Year", key: "year", width: 10},
    {header: "Month", key: "month", width: 10},
    {header: "Status", key: "status", width: 18},
    {header: "Email", key: "email", width: 32},
    {header: "First name", key: "firstName", width: 16},
    {header: "Last name", key: "lastName", width: 16},
    {header: "Billed minutes", key: "minutes", width: 16},
    {header: "Total (CHF)", key: "total", width: 16},
    {header: "Currency", key: "currency", width: 12},
    {header: "Statement ID", key: "id", width: 38},
    {header: "Finalized at", key: "finalized", width: 24},
  ];
  styleHeader(sheet.getRow(1));
  sheet.getColumn("total").numFmt = '#,##0.00';
  for (const row of input.rows) {
    sheet.addRow({
      year: row.statement.year,
      month: row.statement.month,
      status: row.statement.status,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      minutes: row.statement.billedMinutes,
      total: money(row.statement.totalMinor),
      currency: row.statement.currency,
      id: row.statement.id,
      finalized: row.statement.finalizedAt ?? "",
    });
  }
  return toBuffer(workbook);
}

export async function statementDetailToXlsx(detail: StatementDetail): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "mhp-coaching";
  const sheet = workbook.addWorksheet("Statement", {views: [{state: "frozen", ySplit: 1}]});
  sheet.columns = [
    {header: "Kind", key: "kind", width: 16},
    {header: "Description", key: "description", width: 40},
    {header: "Minutes", key: "minutes", width: 12},
    {header: "Amount (CHF)", key: "amount", width: 16},
    {header: "Reason", key: "reason", width: 36},
    {header: "Currency", key: "currency", width: 12},
  ];
  styleHeader(sheet.getRow(1));
  sheet.getColumn("amount").numFmt = '#,##0.00';
  for (const line of detail.lines) {
    sheet.addRow({
      kind: line.kind,
      description: line.description,
      minutes: line.minutes ?? "",
      amount: money(line.amountMinor),
      reason: line.reason ?? "",
      currency: detail.statement.currency,
    });
  }
  sheet.addRow({
    kind: "TOTAL",
    description: `${detail.statement.year}-${String(detail.statement.month).padStart(2, "0")}`,
    minutes: detail.statement.billedMinutes,
    amount: money(detail.statement.totalMinor),
    reason: formatChf(minorUnitsToFrancs(detail.statement.totalMinor), "fr"),
    currency: detail.statement.currency,
  });
  return toBuffer(workbook);
}
