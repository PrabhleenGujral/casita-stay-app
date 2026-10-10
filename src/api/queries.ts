import type { UseQueryResult } from "@tanstack/react-query";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import type { SearchFilters } from "../lib/types";
import {
  createBooking,
  fetchAvailability,
  fetchListing,
  fetchListings,
} from "./listings";
import type { Availability } from "./schemas";

// Cache keys
export const listingKeys = {
  all: ["listings"] as const,
  search: (filters: SearchFilters) => ["listings", "search", filters] as const,
  detail: (id: string) => ["listings", "detail", id] as const,
  availability: (id: string) => ["listings", "availability", id] as const,
  availabilityMonth: (id: string, month: string) =>
    ["listings", "availability", id, month] as const,
};

// Search results.
export function useListingSearch(filters: SearchFilters) {
  return useInfiniteQuery({
    queryKey: listingKeys.search(filters),
    initialPageParam: filters.page,
    queryFn: ({ pageParam, signal }) =>
      fetchListings({ ...filters, page: pageParam }, signal),
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.pageSize < lastPage.total
        ? lastPage.page + 1
        : undefined,
    placeholderData: keepPreviousData,
  });
}

// Query options used to prefetch and to load saved homes.
export function listingQuery(id: string) {
  return {
    queryKey: listingKeys.detail(id),
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchListing(id, signal),
  };
}

export function useListing(id: string) {
  return useQuery(listingQuery(id));
}

// Merges the results of every month into one simple object.
function combineAvailability(results: UseQueryResult<Availability>[]) {
  const bookedDates = new Set<string>();
  for (const result of results) {
    result.data?.bookedDates.forEach((date) => bookedDates.add(date));
  }

  return {
    bookedDates,
    isPending: results.some((result) => result.isPending),
    isFetching: results.some((result) => result.isFetching),
    isError: results.some((result) => result.isError),
    isRetrying: results.some((result) => result.isError && result.isFetching),
    refetch: () =>
      Promise.all(
        results
          .filter((result) => result.isError)
          .map((result) => result.refetch())
      ),
  };
}

// One request combined into a single set of booked dates.
export function useAvailability(id: string, months: string[]) {
  return useQueries({
    queries: months.map((month) => ({
      queryKey: listingKeys.availabilityMonth(id, month),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchAvailability(id, month, signal),
      staleTime: 30_000,
    })),
    combine: combineAvailability,
  });
}

export function useCreateBooking() {
  return useMutation({ mutationFn: createBooking });
}
