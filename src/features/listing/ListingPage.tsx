import type { MouseEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { isNotFound } from "../../api/client";
import { useListing } from "../../api/queries";
import { ErrorState } from "../../components/ErrorState";
import { NotFound } from "../../components/NotFound";
import { plural } from "../../lib/format";
import { FavouriteButton } from "../favourites/FavouriteButton";
import { useFavourites } from "../favourites/favourites";
import { BookingSection } from "./BookingSection";
import { Gallery } from "./Gallery";
import styles from "./ListingPage.module.css";

export function ListingPage() {
  const { id = "" } = useParams();
  const { data: listing, isPending, isError, error, refetch } = useListing(id);
  const favourites = useFavourites();
  const navigate = useNavigate();

  //default location
  const cameFromApp = useLocation().key !== "default";

  // Going back keeps the guest's filters, page and scroll position.
  const handleBackClick = (event: MouseEvent) => {
    if (!cameFromApp) return;
    event.preventDefault();
    navigate(-1);
  };

  if (isPending) {
    return (
      <div aria-busy="true" aria-label="Loading listing">
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonImage} />
      </div>
    );
  }

  if (isError) {
    if (isNotFound(error)) {
      return (
        <NotFound message="This home does not exist or is no longer listed." />
      );
    }
    return (
      <ErrorState
        title="We could not load this home"
        onRetry={() => void refetch()}
      />
    );
  }

  const bedroomText =
    listing.bedrooms === 0 ? "Studio" : plural(listing.bedrooms, "bedroom");

  return (
    <article className={styles.page}>
      <Link to="/" className={styles.back} onClick={handleBackClick}>
        ← Back to results
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{listing.title}</h1>
          <p className={styles.meta}>
            <span aria-label={`Rated ${listing.rating} out of 5`}>
              ★ {listing.rating.toFixed(1)}
            </span>
            <span>{listing.city}</span>
            <span>{plural(listing.maxGuests, "guest")}</span>
            <span>{bedroomText}</span>
          </p>
        </div>
        <FavouriteButton
          listingId={listing.id}
          title={listing.title}
          isFavourite={favourites.has(listing.id)}
        />
      </header>

      <Gallery photos={listing.photos} title={listing.title} />

      <div className={styles.about}>
        <section aria-labelledby="host-heading" className={styles.host}>
          <img
            src={listing.host.avatarUrl}
            alt=""
            width={56}
            height={56}
            loading="lazy"
          />
          <div>
            <h2 id="host-heading">Hosted by {listing.host.name}</h2>
            <p>
              {listing.host.isSuperhost && <strong>Superhost · </strong>}
              Hosting since {listing.host.joinedYear}
            </p>
          </div>
        </section>

        <section aria-labelledby="description-heading">
          <h2 id="description-heading">About this home</h2>
          <p>{listing.description}</p>
        </section>

        <section aria-labelledby="amenities-heading">
          <h2 id="amenities-heading">What this place offers</h2>
          <ul className={styles.amenities}>
            {listing.amenities.map((amenity) => (
              <li key={amenity}>{amenity}</li>
            ))}
          </ul>
        </section>
      </div>

      <BookingSection listing={listing} />
    </article>
  );
}
