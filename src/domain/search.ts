import { DEFAULT_FILTERS, MAX_GUESTS, type SearchFilters } from "../lib/types";

export const CITIES = [
  "Lisbon",
  "Barcelona",
  "Mexico City",
  "Austin",
  "Kyoto",
] as const;

export const SORT_OPTIONS = [
  "recommended",
  "price-asc",
  "price-desc",
  "rating",
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

function readInt(
  params: URLSearchParams,
  key: string,
  min: number,
  max = Infinity
) {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) return null;
  return value;
}

function isSortOption(value: string | null): value is SortOption {
  return SORT_OPTIONS.some((option) => option === value);
}

/* Reads filters from the URL. */
export function parseFilters(params: URLSearchParams): SearchFilters {
  let minPrice = readInt(params, "minPrice", 0);
  let maxPrice = readInt(params, "maxPrice", 0);
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const sort = params.get("sort");

  return {
    city: params.get("city")?.trim() ?? "",
    minPrice,
    maxPrice,
    guests: readInt(params, "guests", 1, MAX_GUESTS),
    sort: isSortOption(sort) ? sort : DEFAULT_FILTERS.sort,
    page: readInt(params, "page", 1) ?? 1,
  };
}

/** search params */
export function toSearchParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.minPrice !== null)
    params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== null)
    params.set("maxPrice", String(filters.maxPrice));
  if (filters.guests !== null) params.set("guests", String(filters.guests));
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

/** update filters and reset pagination */
export function updateFilters(
  current: SearchFilters,
  patch: Partial<SearchFilters>
): SearchFilters {
  const resetsPage = Object.keys(patch).some((key) => key !== "page");
  return { ...current, ...(resetsPage ? { page: 1 } : null), ...patch };
}
