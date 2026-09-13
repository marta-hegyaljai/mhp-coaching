const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ZURICH = "Europe/Zurich";

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const instant = new Date(Date.UTC(year, month - 1, day));

  return (
    instant.getUTCFullYear() === year &&
    instant.getUTCMonth() === month - 1 &&
    instant.getUTCDate() === day
  );
}

export function toIsoDate(year: number, monthIndex: number, day: number): string {
  const instant = new Date(Date.UTC(year, monthIndex, day));
  const month = String(instant.getUTCMonth() + 1).padStart(2, "0");
  const date = String(instant.getUTCDate()).padStart(2, "0");
  return `${instant.getUTCFullYear()}-${month}-${date}`;
}

export function parseIsoDate(value: string): {year: number; month: number; day: number} | null {
  if (!isIsoDate(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return {year, month: month - 1, day};
}

export function shiftMonth(
  year: number,
  monthIndex: number,
  delta: number,
): {year: number; month: number} {
  const instant = new Date(Date.UTC(year, monthIndex + delta, 1));
  return {year: instant.getUTCFullYear(), month: instant.getUTCMonth()};
}

/** Monday-first weeks. Empty cells stay `null` so adjacent months are not implied. */
export function monthWeeks(year: number, monthIndex: number): Array<Array<string | null>> {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const mondayIndex = (first.getUTCDay() + 6) % 7;
  const cells: Array<string | null> = [
    ...Array.from({length: mondayIndex}, () => null),
    ...Array.from({length: daysInMonth}, (_, index) => toIsoDate(year, monthIndex, index + 1)),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: Array<Array<string | null>> = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export function todayIsoInZurich(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZURICH,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isIsoInRange(value: string, min?: string, max?: string): boolean {
  if (!isIsoDate(value)) {
    return false;
  }
  if (min && isIsoDate(min) && value < min) {
    return false;
  }
  if (max && isIsoDate(max) && value > max) {
    return false;
  }
  return true;
}
