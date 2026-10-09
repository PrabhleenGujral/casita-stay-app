import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { listingQuery, useListingSearch } from "../../api/queries";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { useFavourites } from "../favourites/favourites";
import { Filters } from "./Filters";
import { ListingCard } from "./ListingCard";
import { Pagination } from "./Pagination";
import { useSearchFilters } from "./useSearchFilters";
import styles from "./SearchPage.module.css";
import { PRIORITY_IMAGES, SKELETON_COUNT } from "../../lib/types";
import { getHeading, getResultSummary } from "../../lib/functions";

export function SearchPage() {
  const [filters, setFilters] = useSearchFilters();
  const { data, isPending, isError, isPlaceholderData, refetch } =
    useListingSearch(filters);
  const favourites = useFavourites();
  const queryClient = useQueryClient();

  const prefetchListing = useCallback(
    (id: string) => void queryClient.prefetchQuery(listingQuery(id)),
    [queryClient]
  );

  const clearFilters = () =>
    setFilters({ city: "", minPrice: null, maxPrice: null, guests: null });

  const totalPages = data ? Math.ceil(data?.total / data?.pageSize) : 0;

  let content;
  if (isError) {
    content = (
      <ErrorState
        title="We could not load homes"
        message="Something went wrong while searching. Your filters are kept."
        onRetry={() => void refetch()}
      />
    );
  } else if (isPending) {
    content = (
      <ul className={styles.grid} aria-busy="true" aria-label="Loading homes">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <li key={i} className={styles.skeleton} />
        ))}
      </ul>
    );
  } else if (data?.items?.length === 0) {
    content = (
      <EmptyState
        title={
          filters.page > 1
            ? "No homes on this page"
            : "No homes match your search"
        }
        message="Try another city, a wider price range or fewer guests."
        action={
          <button type="button" className="button" onClick={clearFilters}>
            Clear filters
          </button>
        }
      />
    );
  } else {
    content = (
      <>
        <ul
          className={styles.grid}
          aria-busy={isPlaceholderData}
          data-stale={isPlaceholderData || undefined}
        >
          {data?.items?.map((listing, index) => (
            <li key={listing.id}>
              <ListingCard
                listing={listing}
                isFavourite={favourites.has(listing?.id)}
                priority={index < PRIORITY_IMAGES}
                onPrefetch={prefetchListing}
              />
            </li>
          ))}
        </ul>
        <Pagination filters={filters} totalPages={totalPages} />
      </>
    );
  }

  return (
    <>
      <h1 className={styles.heading}>{getHeading(filters.city)}</h1>

      <Filters filters={filters} onChange={setFilters} />

      <p className={styles.status} role="status">
        {data &&
          !isError &&
          getResultSummary(data?.total, data?.page, data?.pageSize)}
      </p>

      {content}
    </>
  );
}
