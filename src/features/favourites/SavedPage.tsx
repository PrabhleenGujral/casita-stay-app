import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listingQuery } from "../../api/queries";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { ListingCard } from "../search/ListingCard";
import { useFavourites } from "./favourites";
import styles from "../search/SearchPage.module.css";

// so each saved home is fetched (and cached) on its own.
export function SavedPage() {
  const favourites = useFavourites();
  const ids = [...favourites];
  const results = useQueries({ queries: ids.map((id) => listingQuery(id)) });

  const failedResults = results.filter((result) => result.isError);
  const isLoading = results.some((result) => result.isPending);

  // Only keep the listings that loaded successfully.
  const listings = [];
  for (const result of results) {
    if (result.data) listings.push(result.data);
  }

  const retryFailed = () => {
    failedResults.forEach((result) => void result.refetch());
  };

  if (ids.length === 0) {
    return (
      <>
        <h1 className={styles.heading}>Saved homes</h1>
        <EmptyState
          title="No saved homes yet"
          message="Tap the heart on any home to keep it here."
          action={
            <Link to="/" className="button">
              Browse homes
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <h1 className={styles.heading}>Saved homes</h1>

      {failedResults.length > 0 && (
        <ErrorState
          title={`${failedResults.length} saved home${
            failedResults.length > 1 ? "s" : ""
          } did not load`}
          onRetry={retryFailed}
          isRetrying={failedResults.some((result) => result.isFetching)}
        />
      )}

      <ul className={styles.grid} aria-busy={isLoading}>
        {listings.map((listing) => (
          <li key={listing.id}>
            <ListingCard listing={listing} isFavourite />
          </li>
        ))}
      </ul>
    </>
  );
}
