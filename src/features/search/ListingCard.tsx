import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { formatCents, plural } from "../../lib/format";
import { FavouriteButton } from "../favourites/FavouriteButton";
import { MiniCalendar } from "./MiniCalendar";
import styles from "./ListingCard.module.css";
import type { ListingCardProps } from "../../lib/types";

export const ListingCard = memo(function ListingCard({
  listing,
  isFavourite,
  priority = false,
  onPrefetch,
}: ListingCardProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const prefetch = () => onPrefetch?.(listing?.id);

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <img
          src={listing?.thumbnailUrl}
          alt=""
          width={480}
          height={360}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
        <FavouriteButton
          className={styles.favourite}
          listingId={listing?.id}
          title={listing?.title}
          isFavourite={isFavourite}
        />
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span>{listing?.city}</span>
          <span aria-label={`Rated ${listing?.rating} out of 5`}>
            ★ {listing?.rating.toFixed(1)}
          </span>
        </div>

        <h2 className={styles.title}>
          <Link
            to={`/listings/${listing?.id}`}
            className={styles.link}
            onPointerEnter={prefetch}
            onFocus={prefetch}
          >
            {listing?.title}
          </Link>
        </h2>

        <p className={styles.guests}>
          Up to {plural(listing?.maxGuests, "guest")}
        </p>

        {showCalendar && (
          <div className={styles.calendarPreview}>
            <MiniCalendar listingId={listing?.id} />
          </div>
        )}

        <div className={styles.footer}>
          <p className={styles.price}>
            <strong>{formatCents(listing?.pricePerNight)}</strong> per night
          </p>
          <button
            type="button"
            className={styles.calendarToggle}
            onClick={() => setShowCalendar(!showCalendar)}
            aria-label={showCalendar ? "Hide calendar" : "Show calendar"}
          >
            {showCalendar ? "Hide dates" : "Check dates"}
          </button>
        </div>
      </div>
    </article>
  );
});
