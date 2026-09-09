import type {CalendarSession} from "./calendar";
import {eachIsoDateInRange} from "./dates";

export type CalendarWeek = Array<string | null>;

export type SessionBar = {
  key: string;
  session: CalendarSession;
  startCol: number;
  span: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

export function sessionRangeEnd(session: Pick<CalendarSession, "startDate" | "endDate">): string {
  return session.endDate && session.endDate > session.startDate
    ? session.endDate
    : session.startDate;
}

export function sessionOccupiesIso(
  session: Pick<CalendarSession, "startDate" | "endDate">,
  isoDate: string,
): boolean {
  return isoDate >= session.startDate && isoDate <= sessionRangeEnd(session);
}

export function sessionKey(session: Pick<CalendarSession, "courseId" | "dateId">): string {
  return `${session.courseId}:${session.dateId}`;
}

export function sessionSpanLabel(
  session: Pick<CalendarSession, "startDate" | "endDate">,
): string {
  const startDay = Number(session.startDate.slice(8, 10));
  const end = sessionRangeEnd(session);
  const endDay = Number(end.slice(8, 10));

  if (session.startDate === end) {
    return String(startDay);
  }

  return `${startDay}–${endDay}`;
}

export function sessionBarLabel(
  bar: Pick<SessionBar, "session" | "continuesBefore" | "continuesAfter">,
): string {
  const prefix = bar.continuesBefore ? "← " : "";
  const suffix = bar.continuesAfter ? " →" : "";
  return `${prefix}${sessionSpanLabel(bar.session)} · ${bar.session.title}${suffix}`;
}

export function occupiedMonthKeys(
  session: Pick<CalendarSession, "startDate" | "endDate">,
): string[] {
  return [
    ...new Set(
      eachIsoDateInRange(session.startDate, session.endDate).map((iso) =>
        iso.slice(0, 7),
      ),
    ),
  ];
}

export function firstIsoInMonth(
  session: Pick<CalendarSession, "startDate" | "endDate">,
  year: number,
  month: number,
): string | null {
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const from = session.startDate > monthStart ? session.startDate : monthStart;
  const to = sessionRangeEnd(session) < monthEnd ? sessionRangeEnd(session) : monthEnd;
  return from <= to ? from : null;
}

export function monthWeeks(year: number, month: number): CalendarWeek[] {
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const mondayIndex = (first.getUTCDay() + 6) % 7;
  const cells: CalendarWeek = [
    ...Array.from({length: mondayIndex}, () => null),
    ...Array.from({length: daysInMonth}, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      const monthLabel = String(month + 1).padStart(2, "0");
      return `${year}-${monthLabel}-${day}`;
    }),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: CalendarWeek[] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export function sessionBarsForWeek(
  week: CalendarWeek,
  sessions: CalendarSession[],
): SessionBar[] {
  const intervals = sessions.flatMap((session) => {
    const cols: number[] = [];

    week.forEach((iso, col) => {
      if (iso && sessionOccupiesIso(session, iso)) {
        cols.push(col);
      }
    });

    if (cols.length === 0) {
      return [];
    }

    const startCol = cols[0];
    const endCol = cols[cols.length - 1];
    const firstIso = week[startCol];
    const lastIso = week[endCol];

    if (!firstIso || !lastIso) {
      return [];
    }

    return [
      {
        session,
        startCol,
        span: endCol - startCol + 1,
        continuesBefore: session.startDate < firstIso,
        continuesAfter: sessionRangeEnd(session) > lastIso,
      },
    ];
  });

  intervals.sort((left, right) => {
    if (left.startCol !== right.startCol) {
      return left.startCol - right.startCol;
    }
    return right.span - left.span;
  });

  const laneEnds: number[] = [];

  return intervals.map((interval) => {
    let lane = laneEnds.findIndex((endCol) => endCol < interval.startCol);

    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(interval.startCol + interval.span - 1);
    } else {
      laneEnds[lane] = interval.startCol + interval.span - 1;
    }

    return {
      ...interval,
      lane,
      key: `${sessionKey(interval.session)}-${interval.startCol}`,
    };
  });
}
