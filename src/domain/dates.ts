import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";

//formatting
export type IsoDate = string;

export interface DateRange {
  checkIn: IsoDate | null;
  checkOut: IsoDate | null;
}

export type DateRangeError =
  | "same-day"
  | "checkout-before-checkin"
  | "in-past"
  | "booked-night";

export type RangeValidation =
  | { ok: true; nights: number }
  | { ok: false; error: DateRangeError };

export const EMPTY_RANGE: DateRange = { checkIn: null, checkOut: null };

export function toIsoDate(date: Date): IsoDate {
  return format(date, "yyyy-MM-dd");
}

export function addDaysIso(date: IsoDate, amount: number): IsoDate {
  return toIsoDate(addDays(parseISO(date), amount));
}

export function nightsBetween(checkIn: IsoDate, checkOut: IsoDate): number {
  return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}

// Returns month keys (YYYY-MM), starting with the month that contains `from`.
export function upcomingMonths(from: IsoDate, count: number): string[] {
  const firstMonth = startOfMonth(parseISO(from));
  const months: string[] = [];

  for (let i = 0; i < count; i++) {
    months.push(format(addMonths(firstMonth, i), "yyyy-MM"));
  }
  return months;
}

// Last day of the bookable window
export function windowEnd(from: IsoDate, months: number): IsoDate {
  const firstDayAfterWindow = addMonths(startOfMonth(parseISO(from)), months);
  return toIsoDate(addDays(firstDayAfterWindow, -1));
}

// A stay uses the nights from check-in up to, but not including, check-out.
// So a booked date can still be someone else's check-out day.
export function stayNights(checkIn: IsoDate, checkOut: IsoDate): IsoDate[] {
  const count = Math.max(nightsBetween(checkIn, checkOut), 0);
  const nights: IsoDate[] = [];

  for (let i = 0; i < count; i++) {
    nights.push(addDaysIso(checkIn, i));
  }
  return nights;
}

export function validateRange(
  checkIn: IsoDate,
  checkOut: IsoDate,
  bookedDates: ReadonlySet<IsoDate>,
  today?: IsoDate
): RangeValidation {
  if (checkIn === checkOut) return { ok: false, error: "same-day" };
  if (checkOut < checkIn)
    return { ok: false, error: "checkout-before-checkin" };
  if (today && checkIn < today) return { ok: false, error: "in-past" };

  const nights = stayNights(checkIn, checkOut);
  if (nights.some((night) => bookedDates.has(night))) {
    return { ok: false, error: "booked-night" };
  }

  return { ok: true, nights: nights.length };
}

// The first booked date after check-in. It is the latest day the guest can check out.
export function nextBookedDate(
  checkIn: IsoDate,
  bookedDates: ReadonlySet<IsoDate>
): IsoDate | null {
  let next: IsoDate | null = null;

  for (const date of bookedDates) {
    if (date > checkIn && (next === null || date < next)) {
      next = date;
    }
  }
  return next;
}

interface SelectableOptions {
  range: DateRange;
  bookedDates: ReadonlySet<IsoDate>;
  today: IsoDate;
  lastDay: IsoDate;
}

export function isSelectable(
  day: IsoDate,
  { range, bookedDates, today, lastDay }: SelectableOptions
) {
  if (day < today || day > lastDay) return false;

  const { checkIn, checkOut } = range;
  const isPickingCheckOut =
    checkIn !== null && checkOut === null && day > checkIn;

  // Normal case: any day that is not booked can be a check-in.
  if (!isPickingCheckOut) return !bookedDates.has(day);

  // Picking check-out: the guest can go up to (and including) the next booked day.
  const limit = nextBookedDate(checkIn, bookedDates);
  return limit === null || day <= limit;
}

// 1st click sets check-in, 2nd click sets check-out.
export function selectDay(
  range: DateRange,
  day: IsoDate,
  bookedDates: ReadonlySet<IsoDate>
): DateRange {
  const startOver: DateRange = bookedDates.has(day)
    ? range
    : { checkIn: day, checkOut: null };

  const { checkIn, checkOut } = range;
  if (!checkIn || checkOut || day <= checkIn) return startOver;

  const result = validateRange(checkIn, day, bookedDates);
  return result.ok ? { checkIn, checkOut: day } : startOver;
}
