import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import { addDaysIso, toIsoDate, type IsoDate } from "../domain/dates";
import { CITIES } from "../domain/search";
import { plural } from "./format";

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export function getNextFocusDay(key: string, day: IsoDate): IsoDate | null {
  const date = parseISO(day);

  switch (key) {
    case "ArrowLeft":
      return addDaysIso(day, -1);
    case "ArrowRight":
      return addDaysIso(day, 1);
    case "ArrowUp":
      return addDaysIso(day, -7);
    case "ArrowDown":
      return addDaysIso(day, 7);
    case "Home":
      return toIsoDate(startOfWeek(date, WEEK_OPTIONS));
    case "End":
      return toIsoDate(endOfWeek(date, WEEK_OPTIONS));
    case "PageUp":
      return toIsoDate(addMonths(date, -1));
    case "PageDown":
      return toIsoDate(addMonths(date, 1));
    default:
      return null;
  }
}

//gets the weeks of a month as an array of arrays of IsoDate or null
export function getMonthWeeks(month: string): (IsoDate | null)[][] {
  const firstDay = parseISO(`${month}-01`);
  const allDays = eachDayOfInterval({
    start: startOfWeek(firstDay, WEEK_OPTIONS),
    end: endOfWeek(endOfMonth(firstDay), WEEK_OPTIONS),
  });

  const cells = allDays?.map((date) =>
    format(date, "yyyy-MM") === month ? toIsoDate(date) : null
  );

  const weeks: (IsoDate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

//a day between the first and last bookable day
export function clamp(day: IsoDate, min: IsoDate, max: IsoDate) {
  if (day < min) return min;
  if (day > max) return max;
  return day;
}

//change to price from string to number, return null if invalid or negative
export function toPrice(value: string) {
  const price = Number.parseInt(value, 10);
  return Number.isNaN(price) || price < 0 ? null : price;
}
//city heading for the search page
export function getHeading(city: string) {
  if (!city) return "Find a place to stay";

  const knownCity = CITIES.find(
    (name) => name.toLowerCase() === city.toLowerCase()
  );
  return knownCity ? `Homes in ${knownCity}` : `Homes matching “${city}”`;
}
// Result summary for the search page
export function getResultSummary(
  total: number,
  page: number,
  pageSize: number
) {
  if (total === 0) return "No homes found";

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  if (first > total) return `${plural(total, "home")} found`;

  return `Showing ${first}–${last} of ${plural(total, "home")}`;
}
