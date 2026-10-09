import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import {
  listingKeys,
  useAvailability,
  useCreateBooking,
} from "../../api/queries";
import type { Booking, Listing } from "../../api/schemas";
import { ErrorState } from "../../components/ErrorState";
import type { DateRange, IsoDate } from "../../domain/dates";
import {
  EMPTY_RANGE,
  selectDay,
  toIsoDate,
  upcomingMonths,
  validateRange,
  windowEnd,
} from "../../domain/dates";
import type { GuestDetails } from "../../domain/guestDetails";
import { calculatePrice } from "../../domain/pricing";
import { formatShortDate, formatUsd, plural } from "../../lib/format";
import type { ConfirmationState } from "../booking/confirmationState";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { BookingForm } from "./BookingForm";
import { PriceBreakdown } from "./PriceBreakdown";
import styles from "./BookingSection.module.css";

// How many months the guest can book ahead.
const MONTHS_AHEAD = 3;

type SubmitError = { kind: "conflict" } | { kind: "failed"; message: string };

// The short text above the calendar that tells the guest what to do next.
function getRangeHint(range: DateRange, nights: number | null) {
  if (!range.checkIn) return "Select a check-in date.";
  if (!range.checkOut) return "Now select a check-out date.";
  return nights ? `${plural(nights, "night")} selected.` : "";
}

export function BookingSection({ listing }: { listing: Listing }) {
  const [today] = useState(() => toIsoDate(new Date()));
  const months = useMemo(() => upcomingMonths(today, MONTHS_AHEAD), [today]);
  const lastDay = windowEnd(today, MONTHS_AHEAD);

  const [range, setRange] = useState<DateRange>(EMPTY_RANGE);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);

  const availability = useAvailability(listing.id, months);
  const booking = useCreateBooking();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check the chosen dates and work out the price
  let nights: number | null = null;
  if (range.checkIn && range.checkOut) {
    const validation = validateRange(
      range.checkIn,
      range.checkOut,
      availability.bookedDates,
      today
    );
    if (validation.ok) nights = validation.nights;
  }
  const price = nights ? calculatePrice(listing.pricePerNight, nights) : null;

  const refreshAvailability = () => {
    void queryClient.invalidateQueries({
      queryKey: listingKeys.availability(listing.id),
    });
  };

  const handleSelect = (day: IsoDate) => {
    setSubmitError(null);
    setRange((current) => selectDay(current, day, availability.bookedDates));
  };

  const handleBookingSuccess = (result: Booking, details: GuestDetails) => {
    refreshAvailability();

    // The confirmation page reads this data from the router state.
    const state: ConfirmationState = {
      booking: result,
      listing: {
        title: listing.title,
        city: listing.city,
        thumbnailUrl: listing.thumbnailUrl,
      },
      guest: { name: details.name, email: details.email },
    };
    navigate(`/bookings/${result.id}`, { state });
  };

  const handleBookingError = (error: Error) => {
    // 409 means someone else booked these nights first.
    if (error instanceof ApiError && error.status === 409) {
      setSubmitError({ kind: "conflict" });
      setRange(EMPTY_RANGE);
      refreshAvailability();
      return;
    }

    // Show the server's message for 4xx errors, a generic one otherwise.
    const message =
      error instanceof ApiError && error.status < 500
        ? error.message
        : "We could not reach the booking service.";
    setSubmitError({ kind: "failed", message });
  };

  const handleSubmit = (details: GuestDetails) => {
    if (!range.checkIn || !range.checkOut) return;
    setSubmitError(null);

    const request = {
      listingId: listing.id,
      checkIn: range.checkIn,
      checkOut: range.checkOut,
      ...details,
    };

    booking.mutate(request, {
      onSuccess: (result) => handleBookingSuccess(result, details),
      onError: handleBookingError,
    });
  };

  // The calendar area changes depending on the availability request.
  let calendar;
  if (availability.isPending) {
    calendar = (
      <p className={styles.loading} aria-busy="true">
        Checking availability…
      </p>
    );
  } else if (availability.isError) {
    calendar = (
      <ErrorState
        title="Availability did not load"
        message="We need the calendar to show which dates are free."
        onRetry={() => void availability.refetch()}
      />
    );
  } else {
    calendar = (
      <AvailabilityCalendar
        months={months}
        today={today}
        lastDay={lastDay}
        bookedDates={availability.bookedDates}
        range={range}
        onSelect={handleSelect}
      />
    );
  }

  return (
    <div className={styles.section}>
      <section
        className={styles.calendar}
        aria-labelledby="availability-heading"
      >
        <div className={styles.calendarHeader}>
          <h2 id="availability-heading">Availability</h2>
          {(range.checkIn || range.checkOut) && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setRange(EMPTY_RANGE)}
            >
              Clear dates
            </button>
          )}
        </div>
        <p className={styles.hint} aria-live="polite">
          {getRangeHint(range, nights)}
        </p>

        {calendar}
      </section>

      <aside className={styles.panel} aria-labelledby="booking-heading">
        <h2 id="booking-heading" className={styles.panelHeading}>
          <strong>{formatUsd(listing.pricePerNight)}</strong> <span>night</span>
        </h2>

        <div className={styles.dates}>
          <div>
            <span className={styles.dateLabel}>Check-in</span>
            {range.checkIn ? formatShortDate(range.checkIn) : "Add date"}
          </div>
          <div>
            <span className={styles.dateLabel}>Check-out</span>
            {range.checkOut ? formatShortDate(range.checkOut) : "Add date"}
          </div>
        </div>

        <div aria-live="polite">
          {price && <PriceBreakdown price={price} />}
        </div>

        <div role="alert" className={styles.submitError}>
          {submitError?.kind === "conflict" && (
            <p>
              Sorry, another guest booked some of those nights while you were
              deciding. We have refreshed the calendar, please choose new dates.
            </p>
          )}
          {submitError?.kind === "failed" && (
            <p>
              {submitError.message} Your booking was not made, please try again.
            </p>
          )}
        </div>

        <BookingForm
          maxGuests={listing.maxGuests}
          isSubmitting={booking.isPending}
          datesError={
            price ? null : "Choose your check-in and check-out dates first."
          }
          onSubmit={handleSubmit}
        />
      </aside>
    </div>
  );
}
