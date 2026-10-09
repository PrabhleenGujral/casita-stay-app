import { format, addMonths } from "date-fns";
import { useMemo, useState } from "react";
import { useAvailability } from "../../api/queries";
import { getTodayIsoDate, upcomingMonths } from "../../domain/dates";
import { getMonthWeeks, WEEKDAYS } from "../../lib/functions";
import styles from "./MiniCalendar.module.css";

interface MiniCalendarProps {
  listingId: string;
}

const MONTHS_SHOWN = 3;

export function MiniCalendar({ listingId }: MiniCalendarProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const today = getTodayIsoDate();
  const months = useMemo(() => upcomingMonths(today, MONTHS_SHOWN), [today]);
  const availability = useAvailability(listingId, months);

  const currentMonth = addMonths(new Date(today), monthOffset);
  const monthKey = format(currentMonth, "yyyy-MM");

  const bookedDates = availability.bookedDates;

  const handlePrevMonth = () => {
    if (monthOffset > 0) {
      setMonthOffset(monthOffset - 1);
    }
  };

  const handleNextMonth = () => {
    if (monthOffset < MONTHS_SHOWN - 1) {
      setMonthOffset(monthOffset + 1);
    }
  };

  const weeks = getMonthWeeks(monthKey);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navButton}
          onClick={handlePrevMonth}
          disabled={monthOffset === 0}
          aria-label="Previous month"
        >
          ←
        </button>
        <h4 className={styles.monthName}>
          {format(currentMonth, "MMMM yyyy")}
        </h4>
        <button
          type="button"
          className={styles.navButton}
          onClick={handleNextMonth}
          disabled={monthOffset === MONTHS_SHOWN - 1}
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <table className={styles.grid} role="grid">
        <thead>
          <tr>
            {WEEKDAYS.map((weekday) => (
              <th key={weekday} scope="col" abbr={weekday}>
                {weekday.slice(0, 2)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <td key={dayIndex} />;
                }

                const isBooked = bookedDates.has(day);
                const isPast = day < today;

                return (
                  <td key={day}>
                    <div
                      className={styles.day}
                      data-booked={isBooked || undefined}
                      data-past={isPast || undefined}
                    >
                      {Number(day.slice(8))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendBox} data-available />
          Available
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendBox} data-booked />
          Booked
        </div>
      </div>
    </div>
  );
}
