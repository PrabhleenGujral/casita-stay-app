import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { listingQuery, useListingSearch } from "../../api/queries";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { useFavourites } from "../favourites/favourites";
import { Filters } from "./Filters";
import { useSearchFilters } from "./useSearchFilters";
import { VirtualizedGrid } from "./VirtualizedGrid";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import styles from "./SearchPage.module.css";
import { SKELETON_COUNT } from "../../lib/types";
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

  // Calculate if there are more pages to load
  const currentPage = filters.page || 1;
  const totalPages = data ? Math.ceil(data?.total / data?.pageSize) : 0;
  const hasMore = currentPage < totalPages;

  // Load next page
  const loadMorePage = useCallback(() => {
    if (!hasMore || isPending) return;
    setFilters({ page: currentPage + 1 });
  }, [hasMore, isPending, currentPage, setFilters]);

  // Infinite scroll trigger
  const infiniteScrollRef = useInfiniteScroll({
    onLoadMore: loadMorePage,
    isLoading: isPending || isPlaceholderData,
    hasMore,
  });

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
        <VirtualizedGrid
          items={data?.items ?? []}
          isFavourites={favourites}
          isPlaceholderData={isPlaceholderData}
          onPrefetch={prefetchListing}
        />

        {/* Loading indicator for more items */}
        {hasMore && (
          <>
            <div
              ref={infiniteScrollRef}
              className={styles.infiniteScrollTrigger}
            />
            {(isPending || isPlaceholderData) && (
              <div className={styles.loadingMore} aria-busy="true">
                <div className={styles.spinner} />
                <p>Loading more homes...</p>
              </div>
            )}
          </>
        )}

        {/* End of results message */}
        {!hasMore && data?.items && data.items.length > 0 && (
          <div className={styles.endMessage}>
            <p>You've reached the end of available homes</p>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setFilters({ page: 1 });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              ↑ Back to Top
            </button>
          </div>
        )}
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
