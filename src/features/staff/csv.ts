import type {Booking, WaitlistEntry} from "@/db/schema";
import {minorUnitsToFrancs, formatChf} from "@/features/payments/money";

export function bookingsToCsv(rows: Booking[]): string {
  const header = [
    "id",
    "createdAt",
    "status",
    "firstName",
    "lastName",
    "dateOfBirth",
    "email",
    "phone",
    "street",
    "postalCode",
    "city",
    "country",
    "locale",
    "courseId",
    "courseTitle",
    "courseDateId",
    "courseDateStart",
    "courseDateEnd",
    "location",
    "amountChf",
    "currency",
    "paymentProvider",
    "paymentReference",
    "paidAt",
    "confirmationEmailSentAt",
  ];

  const lines = [header.join(",")];

  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.createdAt.toISOString(),
        row.status,
        row.firstName,
        row.lastName,
        row.dateOfBirth ?? "",
        row.email,
        row.phone,
        row.street,
        row.postalCode,
        row.city,
        row.country,
        row.locale,
        row.courseId,
        row.courseTitle,
        row.courseDateId,
        row.courseDateStart,
        row.courseDateEnd ?? "",
        row.location,
        formatChf(minorUnitsToFrancs(row.amountMinor), "fr"),
        row.currency,
        row.paymentProvider,
        row.paymentReference ?? "",
        row.paidAt?.toISOString() ?? "",
        row.confirmationEmailSentAt?.toISOString() ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  }

  return `${lines.join("\n")}\n`;
}

export function waitlistToCsv(rows: WaitlistEntry[]): string {
  const header = [
    "id",
    "createdAt",
    "courseId",
    "courseTitle",
    "courseSessionId",
    "firstName",
    "lastName",
    "email",
    "phone",
    "locale",
    "notifiedAt",
  ];

  const lines = [header.join(",")];

  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.createdAt.toISOString(),
        row.courseId,
        row.courseTitle,
        row.courseSessionId ?? "",
        row.firstName,
        row.lastName,
        row.email,
        row.phone,
        row.locale,
        row.notifiedAt?.toISOString() ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  }

  return `${lines.join("\n")}\n`;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}
