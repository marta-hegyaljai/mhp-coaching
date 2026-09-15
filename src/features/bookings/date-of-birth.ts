import {
  isIsoInRange,
  shiftIsoDays,
  shiftIsoYears,
  todayIsoInZurich,
} from "@/shared/ui/date-field-calendar";

export const DATE_OF_BIRTH_MAX_AGE_YEARS = 120;

export function dateOfBirthBounds(today = todayIsoInZurich()): {
  min: string;
  max: string;
} {
  return {
    min: shiftIsoYears(today, -DATE_OF_BIRTH_MAX_AGE_YEARS),
    max: shiftIsoDays(today, -1),
  };
}

export function isValidDateOfBirth(
  value: string,
  today = todayIsoInZurich(),
): boolean {
  const {min, max} = dateOfBirthBounds(today);
  return isIsoInRange(value, min, max);
}
