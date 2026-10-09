import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { nightsBetween } from "../../domain/dates";
import { formatDate, formatUsd, plural } from "../../lib/format";
import { confirmationStateSchema } from "./confirmationState";
import styles from "./ConfirmationPage.module.css";

export function ConfirmationPage() {
  const location = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const parsed = confirmationStateSchema?.safeParse(location.state);

  useEffect(() => headingRef.current?.focus(), []);

  if (!parsed.success) {
    return (
      <EmptyState
        title="Booking details unavailable"
        message="We only keep confirmation details in this browser tab. Check your email for the booking summary."
        action={
          <Link to="/" className="button">
            Browse homes
          </Link>
        }
      />
    );
  }

  const { booking, listing, guest } = parsed.data;
  const nights = nightsBetween(booking.checkIn, booking.checkOut);

  return (
    <div className={styles.page}>
      <h1 ref={headingRef} tabIndex={-1} className={styles.heading}>
        You are going to {listing?.city}!
      </h1>
      <p className={styles.lead}>
        Thanks, {guest?.name}. We sent the confirmation to{" "}
        <strong>{guest?.email}</strong>.
      </p>

      <article className={styles.card}>
        <img src={listing?.thumbnailUrl} alt="" width={480} height={360} />
        <div className={styles?.details}>
          <h2>{listing?.title}</h2>
          <dl>
            <div>
              <dt>Booking reference</dt>
              <dd>{booking?.id}</dd>
            </div>
            <div>
              <dt>Check-in</dt>
              <dd>{formatDate(booking?.checkIn)}</dd>
            </div>
            <div>
              <dt>Check-out</dt>
              <dd>{formatDate(booking?.checkOut)}</dd>
            </div>
            <div>
              <dt>Stay</dt>
              <dd>
                {plural(nights, "night")}, {plural(booking?.guests, "guest")}
              </dd>
            </div>
            <div className={styles.total}>
              <dt>Total paid</dt>
              <dd>{formatUsd(booking?.totalPrice)}</dd>
            </div>
          </dl>
        </div>
      </article>

      <div className={styles.actions}>
        <Link
          to={`/listings/${booking?.listingId}`}
          className="button button-secondary"
        >
          Back to listing
        </Link>
        <Link to="/" className="button">
          Browse more homes
        </Link>
      </div>
    </div>
  );
}
