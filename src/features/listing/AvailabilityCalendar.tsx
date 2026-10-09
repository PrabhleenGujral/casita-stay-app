import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import type { IsoDate } from "../../domain/dates";
import { isSelectable } from "../../domain/dates";
import styles from "./AvailabilityCalendar.module.css";
import {
  clamp,
  getMonthWeeks,
  getNextFocusDay,
  WEEKDAYS,
} from "../../lib/functions";
import type { AvailabilityCalendarProps } from "../../lib/types";

export function AvailabilityCalendar({
  months,
  today,
  lastDay,
  bookedDates,
  range,
  onSelect,
}: AvailabilityCalendarProps) {
  const [focusedDay, setFocusedDay] = useState<IsoDate>(range.checkIn ?? today);
  const containerRef = useRef<HTMLDivElement>(null);
  const movedByKeyboard = useRef(false);

  useEffect(() => {
    if (!movedByKeyboard.current) return;
    movedByKeyboard.current = false;

    const button = containerRef.current?.querySelector<HTMLButtonElement>(
      `[data-day="${focusedDay}"]`
    );
    button?.focus();
  }, [focusedDay]);

  const handleKeyDown = (event: KeyboardEvent) => {
    const nextDay = getNextFocusDay(event.key, focusedDay);
    if (!nextDay) return;

    event.preventDefault();
    movedByKeyboard.current = true;
    setFocusedDay(clamp(nextDay, today, lastDay));
  };

  // The text a screen reader reads for each day.
  const getLabel = (day: IsoDate, selectable: boolean, booked: boolean) => {
    const parts = [format(parseISO(day), "EEEE, MMMM d, yyyy")];

    if (day === range?.checkIn) parts.push("check-in");
    if (day === range?.checkOut) parts.push("check-out");

    if (booked) {
      parts.push(selectable ? "booked, available for check-out" : "booked");
    } else if (!selectable) {
      parts.push("unavailable");
    }
    return parts.join(", ");
  };

  return (
    <div
      ref={containerRef}
      className={styles?.months}
      onKeyDown={handleKeyDown}
    >
      {months?.map((month) => {
        const headingId = `calendar-${month}`;

        return (
          <div key={month} className={styles?.month}>
            <h3 id={headingId} className={styles?.monthName}>
              {format(parseISO(`${month}-01`), "MMMM yyyy")}
            </h3>

            <table
              role="grid"
              aria-labelledby={headingId}
              className={styles.grid}
            >
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
                {getMonthWeeks(month)?.map((week, weekIndex) => (
                  <tr key={weekIndex}>
                    {week.map((day, dayIndex) => {
                      if (!day) return <td key={dayIndex} />;

                      const selectable = isSelectable(day, {
                        range,
                        bookedDates,
                        today,
                        lastDay,
                      });
                      // Past days are just "unavailable", even if someone stayed there.
                      const booked = day >= today && bookedDates.has(day);
                      const isEndpoint =
                        day === range?.checkIn || day === range?.checkOut;
                      const isInRange =
                        range?.checkIn !== null &&
                        range?.checkOut !== null &&
                        day > range?.checkIn &&
                        day < range?.checkOut;

                      return (
                        <td key={day}>
                          <button
                            type="button"
                            data-day={day}
                            className={styles.day}
                            data-booked={booked || undefined}
                            data-selected={isEndpoint || undefined}
                            data-in-range={isInRange || undefined}
                            tabIndex={day === focusedDay ? 0 : -1}
                            aria-disabled={!selectable}
                            aria-pressed={isEndpoint}
                            aria-label={getLabel(day, selectable, booked)}
                            onFocus={() => setFocusedDay(day)}
                            onClick={() => selectable && onSelect(day)}
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
      })}
    </div>
  );
}
