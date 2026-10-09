import { memo } from "react";
import { Link } from "react-router-dom";
import { formatUsd, plural } from "../../lib/format";
import { FavouriteButton } from "../favourites/FavouriteButton";
import styles from "./ListingCard.module.css";
import type { ListingCardProps } from "../../lib/types";

export const ListingCard = memo(function ListingCard({
  listing,
  isFavourite,
  priority = false,
  onPrefetch,
}: ListingCardProps) {
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
        <p className={styles.price}>
          <strong>{formatUsd(listing?.pricePerNight)}</strong> night
        </p>
      </div>
    </article>
  );
});
