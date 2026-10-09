import type { SearchFilters } from "../domain/search";
import { toSearchParams } from "../domain/search";
import { request } from "./client";
import type { BookingRequest } from "./schemas";
import {
  availabilitySchema,
  bookingSchema,
  listingPageSchema,
  listingSchema,
} from "./schemas";

//listings api call
export function fetchListings(filters: SearchFilters, signal?: AbortSignal) {
  const query = toSearchParams(filters).toString();
  const path = query ? `/listings?${query}` : "/listings";

  return request(path, listingPageSchema, { signal });
}

export function fetchListing(id: string, signal?: AbortSignal) {
  return request(`/listings/${encodeURIComponent(id)}`, listingSchema, {
    signal,
  });
}

// Booked dates for one month. `month` looks like "2026-10".
export function fetchAvailability(
  id: string,
  month: string,
  signal?: AbortSignal
) {
  const path = `/listings/${encodeURIComponent(
    id
  )}/availability?month=${month}`;
  return request(path, availabilitySchema, { signal });
}
//create booking api call
export function createBooking(body: BookingRequest) {
  return request("/bookings", bookingSchema, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
