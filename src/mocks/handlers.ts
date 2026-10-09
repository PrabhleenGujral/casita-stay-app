import { delay, http, HttpResponse } from "msw";
import type { Booking } from "../api/schemas";
import { bookingRequestSchema } from "../api/schemas";
import { API_BASE } from "../api/client";
import { stayNights, validateRange } from "../domain/dates";
import { calculatePrice } from "../domain/pricing";
import { parseFilters } from "../domain/search";
import type { SearchFilters } from "../lib/types";
import { listings } from "./data";
import {
  bookedDatesForMonth,
  findListing,
  isNightBooked,
  markBooked,
  saveBooking,
} from "./db";

const PAGE_SIZE = 20;
const MONTH_FORMAT = /^\d{4}-\d{2}$/;

export const mockConfig = {
  minLatency: 300,
  maxLatency: 1200,
  failureRate: Number(import.meta.env.VITE_MOCK_FAILURE_RATE ?? 0.1),
  conflictRate: Number(import.meta.env.VITE_MOCK_CONFLICT_RATE ?? 0.2),
};

const api = (path: string) => `*${API_BASE}${path}`;

const error = (status: number, message: string) =>
  HttpResponse.json({ message }, { status });

// Returns null when the request should go ahead normally.
async function simulateNetwork() {
  const { minLatency, maxLatency, failureRate } = mockConfig;
  await delay(minLatency + Math.random() * (maxLatency - minLatency));

  if (Math.random() < failureRate) {
    return error(503, "The service is temporarily unavailable.");
  }
  return null;
}

function filterListings(filters: SearchFilters) {
  const city = filters.city.toLowerCase();

  return listings.filter((listing) => {
    const matchesCity = !city || listing.city.toLowerCase().includes(city);
    const matchesMin =
      filters.minPrice === null || listing.pricePerNight >= filters.minPrice;
    const matchesMax =
      filters.maxPrice === null || listing.pricePerNight <= filters.maxPrice;
    const matchesGuests =
      filters.guests === null || listing.maxGuests >= filters.guests;

    return matchesCity && matchesMin && matchesMax && matchesGuests;
  });
}

// Sorts in place.
function sortListings(items: typeof listings, sort: SearchFilters["sort"]) {
  if (sort === "price-asc") {
    items.sort((a, b) => a.pricePerNight - b.pricePerNight);
  } else if (sort === "price-desc") {
    items.sort((a, b) => b.pricePerNight - a.pricePerNight);
  } else if (sort === "rating") {
    items.sort((a, b) => b.rating - a.rating);
  }
}

// The list page only needs a few fields, not the full listing.
function toSummary(listing: (typeof listings)[number]) {
  return {
    id: listing.id,
    title: listing.title,
    city: listing.city,
    pricePerNight: listing.pricePerNight,
    maxGuests: listing.maxGuests,
    rating: listing.rating,
    thumbnailUrl: listing.thumbnailUrl,
  };
}

export const handlers = [
  // Search results with filters, sorting and pagination
  http.get(api("/listings"), async ({ request }) => {
    const failure = await simulateNetwork();
    if (failure) return failure;

    const filters = parseFilters(new URL(request.url).searchParams);

    const matches = filterListings(filters);
    sortListings(matches, filters.sort);

    const start = (filters.page - 1) * PAGE_SIZE;
    const items = matches.slice(start, start + PAGE_SIZE).map(toSummary);

    return HttpResponse.json({
      items,
      total: matches.length,
      page: filters.page,
      pageSize: PAGE_SIZE,
    });
  }),

  // Single listing details
  http.get(api("/listings/:id"), async ({ params }) => {
    const failure = await simulateNetwork();
    if (failure) return failure;

    const listing = findListing(String(params.id));
    if (!listing) return error(404, "Listing not found.");

    return HttpResponse.json(listing);
  }),

  // Booked dates for one month, e.g. ?month=2026-10
  http.get(api("/listings/:id/availability"), async ({ params, request }) => {
    const failure = await simulateNetwork();
    if (failure) return failure;

    const id = String(params.id);
    const month = new URL(request.url).searchParams.get("month") ?? "";

    if (!findListing(id)) return error(404, "Listing not found.");
    if (!MONTH_FORMAT.test(month)) return error(400, "month must be YYYY-MM.");

    return HttpResponse.json({ bookedDates: bookedDatesForMonth(id, month) });
  }),

  // Create a booking
  http.post(api("/bookings"), async ({ request }) => {
    const failure = await simulateNetwork();
    if (failure) return failure;

    // 1. Validate the request body
    const body = bookingRequestSchema.safeParse(await request.json());
    if (!body.success) return error(400, "Invalid booking details.");

    const { listingId, checkIn, checkOut, guests } = body.data;

    // 2. Check the listing and guest count
    const listing = findListing(listingId);
    if (!listing) return error(404, "Listing not found.");
    if (guests > listing.maxGuests) {
      return error(400, `This home fits up to ${listing.maxGuests} guests.`);
    }

    // 3. Sometimes pretend another guest booked the check-in night first
    if (Math.random() < mockConfig.conflictRate) {
      markBooked(listingId, [checkIn]);
    }

    // 4. Make sure the dates are valid and still free
    const takenNights = new Set(
      stayNights(checkIn, checkOut).filter((night) =>
        isNightBooked(listingId, night)
      )
    );
    const range = validateRange(checkIn, checkOut, takenNights);

    if ("error" in range) {
      return range.error === "booked-night"
        ? error(409, "Some of these dates were just booked by another guest.")
        : error(400, "Invalid date range.");
    }

    // 5. Save and return the booking. Prices are in cents, the API returns dollars.
    const booking: Booking = {
      id: `bk_${crypto.randomUUID().slice(0, 8)}`,
      listingId,
      checkIn,
      checkOut,
      guests,
      totalPrice:
        calculatePrice(listing.pricePerNight / 100, range.nights).total / 100,
    };
    saveBooking(booking);

    return HttpResponse.json(booking, { status: 201 });
  }),
];
