import { describe, expect, it } from "vitest";
import { availabilitySchema, listingSchema } from "../api/schemas";
import { listings } from "./data";
import { bookedDatesForMonth } from "./db";

// Every month a guest could open, including February and a year change.
const MONTHS = ["2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2028-02"];

describe("mock data", () => {
  it("gives every listing a valid detail object", () => {
    for (const listing of listings) {
      expect(listingSchema.safeParse(listing).success, listing.id).toBe(true);
    }
  });

  it("gives every listing valid availability for every month", () => {
    for (const listing of listings) {
      for (const month of MONTHS) {
        const result = availabilitySchema.safeParse({
          bookedDates: bookedDatesForMonth(listing.id, month),
        });
        expect(result.success, `${listing.id} ${month}`).toBe(true);
      }
    }
  });
});
