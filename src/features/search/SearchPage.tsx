import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { listingQuery, useListingSearch } from "../../api/queries";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { useFavourites } from "../favourites/favourites";
import { Filters } from "./Filters";
import { mergePages } from "./mergePages";
import { useSearchFilters } from "./useSearchFilters";
import { VirtualizedGrid } from "./VirtualizedGrid";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import styles from "./SearchPage.module.css";
import { SKELETON_COUNT } from "../../lib/types";
import { getHeading, getResultSummary } from "../../lib/functions";

export function SearchPage() {
  const [filters, setFilters] = useSearchFilters();
  const {
    data,
    isPending,
    isError,
    isPlaceholderData,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useListingSearch(filters);
  const favourites = useFavourites();
  const queryClient = useQueryClient();

  const prefetchListing = useCallback(
    (id: string) => void queryClient.prefetchQuery(listingQuery(id)),
    [queryClient]
  );

  const clearFilters = () =>
    setFilters({ city: "", minPrice: null, maxPrice: null, guests: null });

  // All loaded pages joined into one list.
  const items = useMemo(() => mergePages(data?.pages ?? []), [data]);
  const firstPage = data?.pages[0];
  const hasMore = hasNextPage;

  // Load the next page
  const loadMorePage = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Infinite scroll trigger
  const infiniteScrollRef = useInfiniteScroll({
    onLoadMore: loadMorePage,
    isLoading: isPending || isPlaceholderData || isFetchingNextPage,
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
  } else if (items.length === 0) {
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
          items={items}
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
            {(isPending || isPlaceholderData || isFetchingNextPage) && (
              <div className={styles.loadingMore} aria-busy="true">
                <div className={styles.spinner} />
                <p>Loading more homes...</p>
              </div>
            )}
          </>
        )}

        {/* End of results message */}
        {!hasMore && items.length > 0 && (
          <div className={styles.endMessage}>
            <p>You've reached the end of available homes</p>
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
        {firstPage &&
          !isError &&
          getResultSummary(
            firstPage.total,
            firstPage.page,
            firstPage.pageSize,
            data?.pages.length
          )}
      </p>

      {content}
    </>
  );
}
