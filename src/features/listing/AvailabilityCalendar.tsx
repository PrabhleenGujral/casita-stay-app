/**
 * Availability calendar (UI component) on the listing page.
 */
import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import type { DateRange, IsoDate } from "../../domain/dates";
import { isSelectable } from "../../domain/dates";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import styles from "./AvailabilityCalendar.module.css";
import {
  clamp,
  getMonthWeeks,
  getNextFocusDay,
  WEEKDAYS,
} from "../../lib/functions";
import type { AvailabilityCalendarProps } from "../../lib/types";

function getLabel(
  day: IsoDate,
  range: DateRange,
  selectable: boolean,
  booked: boolean
) {
  const parts = [format(parseISO(day), "EEEE, MMMM d, yyyy")];

  if (day === range.checkIn) parts.push("check-in");
  if (day === range.checkOut) parts.push("check-out");

  if (booked) {
    parts.push(selectable ? "booked, available for check-out" : "booked");
  } else if (!selectable) {
    parts.push("unavailable");
  }
  return parts.join(", ");
}

interface MonthGridProps {
  month: string;
  today: IsoDate;
  lastDay: IsoDate;
  bookedDates: ReadonlySet<IsoDate>;
  range: DateRange;
  previewDay: IsoDate | null;
  rovingDay: IsoDate;
  onHoverDay: (day: IsoDate) => void;
  onFocusDay: (day: IsoDate) => void;
  onClickDay: (day: IsoDate, selectable: boolean) => void;
}

// One month
function MonthGrid({
  month,
  today,
  lastDay,
  bookedDates,
  range,
  previewDay,
  rovingDay,
  onHoverDay,
  onFocusDay,
  onClickDay,
}: MonthGridProps) {
  const headingId = `calendar-${month}`;

  return (
    <div className={styles.month}>
      <h3 id={headingId} className={styles.monthName}>
        {format(parseISO(`${month}-01`), "MMMM yyyy")}
      </h3>

      <table role="grid" aria-labelledby={headingId} className={styles.grid}>
        <thead>
          <tr>
            {WEEKDAYS?.map((weekday) => (
              <th key={weekday} scope="col" abbr={weekday}>
                {weekday.slice(0, 2)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getMonthWeeks(month).map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((day, dayIndex) => {
                if (!day) return <td key={dayIndex} />;

                const selectable = isSelectable(day, {
                  range,
                  bookedDates,
                  today,
                  lastDay,
                });
                const booked = day >= today && bookedDates.has(day);
                const isEndpoint =
                  day === range.checkIn || day === range.checkOut;
                const isOutsideWindow = day < today || day > lastDay;

                const isInRange =
                  range.checkIn !== null &&
                  range.checkOut !== null &&
                  day > range.checkIn &&
                  day < range.checkOut;

                const isInPreview =
                  previewDay !== null &&
                  range.checkIn !== null &&
                  range.checkOut === null &&
                  day >= range.checkIn &&
                  day <= previewDay;

                const isRangeStart =
                  range.checkIn !== null &&
                  day === range.checkIn &&
                  (range.checkOut !== null || isInPreview);
                const isRangeEnd =
                  (range.checkOut !== null && day === range.checkOut) ||
                  (isInPreview && day === previewDay);

                return (
                  <td
                    key={day}
                    data-in-range={isInRange || undefined}
                    data-preview={isInPreview || undefined}
                    data-range-start={isRangeStart || undefined}
                    data-range-end={isRangeEnd || undefined}
                  >
                    <button
                      type="button"
                      data-day={day}
                      className={styles.day}
                      data-booked={booked || undefined}
                      data-outside={isOutsideWindow || undefined}
                      data-today={day === today || undefined}
                      data-selected={isEndpoint || undefined}
                      tabIndex={day === rovingDay ? 0 : -1}
                      aria-disabled={!selectable}
                      aria-pressed={isEndpoint}
                      aria-label={getLabel(day, range, selectable, booked)}
                      onMouseEnter={() => onHoverDay(day)}
                      onFocus={() => onFocusDay(day)}
                      onClick={() => onClickDay(day, selectable)}
                    >
                      {Number(day.slice(8))}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalendarLegend() {
  return (
    <ul className={styles.legend}>
      <li className={styles.legendItem}>
        <span
          className={`${styles.swatch} ${styles.availableSwatch}`}
          aria-hidden="true"
        />
        Available
      </li>
      <li className={styles.legendItem}>
        <span
          className={`${styles.swatch} ${styles.bookedSwatch}`}
          aria-hidden="true"
        />
        Booked
      </li>
      <li className={styles.legendItem}>
        <span
          className={`${styles.swatch} ${styles.selectedSwatch}`}
          aria-hidden="true"
        />
        Selected
      </li>
    </ul>
  );
}

export function AvailabilityCalendar({
  months,
  today,
  lastDay,
  bookedDates,
  range,
  onSelect,
  onReject,
}: AvailabilityCalendarProps) {
  const isWide = useMediaQuery("(min-width: 640px)");
  const visibleMonthCount = isWide ? 2 : 1;
  const maxStartIndex = Math.max(0, months.length - visibleMonthCount);
  const [pageIndex, setPageIndex] = useState(() => {
    const checkInMonth = range.checkIn?.slice(0, 7);
    const checkInIndex = checkInMonth ? months.indexOf(checkInMonth) : 0;
    return Math.min(Math.max(checkInIndex, 0), months.length - 1);
  });
  const visibleStartIndex = Math.min(pageIndex, maxStartIndex);
  const visibleMonths = months.slice(
    visibleStartIndex,
    visibleStartIndex + visibleMonthCount
  );

  const [focusedDay, setFocusedDay] = useState<IsoDate>(range.checkIn ?? today);
  const [previewDay, setPreviewDay] = useState<IsoDate | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const movedByKeyboard = useRef(false);
  const focusMonthIsVisible = visibleMonths.includes(focusedDay.slice(0, 7));
  const rovingDay = focusMonthIsVisible
    ? focusedDay
    : clamp(`${visibleMonths[0]}-01`, today, lastDay);

  useEffect(() => {
    if (!movedByKeyboard.current) return;
    movedByKeyboard.current = false;

    const button = containerRef.current?.querySelector<HTMLButtonElement>(
      `[data-day="${focusedDay}"]`
    );
    button?.focus();
  }, [focusedDay]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const isDayButton =
      event.target instanceof HTMLButtonElement &&
      event.target.hasAttribute("data-day");
    if (!isDayButton) return;

    const targetDay = getNextFocusDay(event.key, focusedDay);
    if (!targetDay) return;

    event.preventDefault();
    const nextDay = clamp(targetDay, today, lastDay);
    if (nextDay === focusedDay) return;

    movedByKeyboard.current = true;
    setFocusedDay(nextDay);

    const nextMonth = nextDay.slice(0, 7);
    const nextMonthIndex = months.indexOf(nextMonth);
    if (nextMonthIndex >= 0 && !visibleMonths.includes(nextMonth)) {
      setPageIndex(
        Math.min(
          Math.max(nextMonthIndex - visibleMonthCount + 1, 0),
          maxStartIndex
        )
      );
    }
  };

  const updatePreview = (day: IsoDate) => {
    const isChoosingCheckOut =
      range.checkIn !== null && range.checkOut === null;
    const isAfterCheckIn = range.checkIn !== null && day > range.checkIn;
    const canChoose = isSelectable(day, { range, bookedDates, today, lastDay });

    setPreviewDay(
      isChoosingCheckOut && isAfterCheckIn && canChoose ? day : null
    );
  };

  const handleFocusDay = (day: IsoDate) => {
    setFocusedDay(day);
    updatePreview(day);
  };

  const handleClickDay = (day: IsoDate, selectable: boolean) => {
    setPreviewDay(null);
    if (selectable) onSelect(day);
    else onReject?.(day);
  };

  return (
    <div
      ref={containerRef}
      className={styles.calendar}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setPreviewDay(null)}
    >
      <div className={styles.paging}>
        <button
          type="button"
          className={styles.pageButton}
          aria-label="Show previous month"
          disabled={visibleStartIndex === 0}
          onClick={() => setPageIndex(Math.max(visibleStartIndex - 1, 0))}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button
          type="button"
          className={styles.pageButton}
          aria-label="Show next month"
          disabled={visibleStartIndex === maxStartIndex}
          onClick={() =>
            setPageIndex(Math.min(visibleStartIndex + 1, maxStartIndex))
          }
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className={isWide ? styles.monthsTwo : styles.monthsOne}>
        {visibleMonths.map((month) => (
          <MonthGrid
            key={month}
            month={month}
            today={today}
            lastDay={lastDay}
            bookedDates={bookedDates}
            range={range}
            previewDay={previewDay}
            rovingDay={rovingDay}
            onHoverDay={updatePreview}
            onFocusDay={handleFocusDay}
            onClickDay={handleClickDay}
          />
        ))}
      </div>

      <CalendarLegend />
    </div>
  );
}
