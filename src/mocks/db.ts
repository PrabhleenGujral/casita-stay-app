import { getDaysInMonth, parseISO } from "date-fns";
import type { Booking } from "../api/schemas";
import type { IsoDate } from "../domain/dates";
import { stayNights } from "../domain/dates";
import { listings } from "./data";
import { createRandom, hashString } from "./random";

// Stores the nights booked during this session, on top of the generated ones. Reset on reload.
const sessionBookings = new Map<string, Set<IsoDate>>();
const fixedBookings = new Map<string, IsoDate[]>();

export function findListing(id: string) {
  return listings.find((listing) => listing.id === id);
}

// Generates a set of booked dates for a listing in a specific month.
function generatedBookedDates(listingId: string, month: string): IsoDate[] {
  const random = createRandom(hashString(`${listingId}:${month}`));
  const daysInMonth = getDaysInMonth(parseISO(`${month}-01`));
  const booked: IsoDate[] = [];

  let day = random.int(1, 6);
  while (day <= daysInMonth) {
    const length = random.int(1, 5);
    for (let i = 0; i < length && day + i <= daysInMonth; i++) {
      booked.push(`${month}-${String(day + i).padStart(2, "0")}`);
    }
    day += length + random.int(3, 12);
  }
  return booked;
}

export function bookedDatesForMonth(
  listingId: string,
  month: string
): IsoDate[] {
  const base =
    fixedBookings.get(listingId) ?? generatedBookedDates(listingId, month);
  const all = [...base, ...(sessionBookings.get(listingId) ?? [])];
  return [...new Set(all.filter((date) => date.startsWith(month)))].sort();
}

export function setFixedBookings(listingId: string, dates: IsoDate[]) {
  fixedBookings.set(listingId, dates);
}

export function isNightBooked(listingId: string, date: IsoDate) {
  return bookedDatesForMonth(listingId, date.slice(0, 7)).includes(date);
}

export function markBooked(listingId: string, nights: IsoDate[]) {
  const booked = sessionBookings.get(listingId) ?? new Set<IsoDate>();
  nights.forEach((night) => booked.add(night));
  sessionBookings.set(listingId, booked);
}

export function saveBooking(booking: Booking) {
  markBooked(booking.listingId, stayNights(booking.checkIn, booking.checkOut));
}

export function resetDb() {
  sessionBookings.clear();
  fixedBookings.clear();
}
