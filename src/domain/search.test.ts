import { describe, expect, it } from "vitest";
import {
  // DEFAULT_FILTERS,
  parseFilters,
  toSearchParams,
  updateFilters,
} from "./search";
import { DEFAULT_FILTERS } from "../lib/types";

const parse = (query: string) => parseFilters(new URLSearchParams(query));

describe("parseFilters", () => {
  it("returns defaults for an empty query", () => {
    expect(parse("")).toEqual(DEFAULT_FILTERS);
  });

  it("reads every filter", () => {
    expect(
      parse(
        "city=Lisbon&minPrice=50&maxPrice=200&guests=3&sort=price-asc&page=2"
      )
    ).toEqual({
      city: "Lisbon",
      minPrice: 50,
      maxPrice: 200,
      guests: 3,
      sort: "price-asc",
      page: 2,
    });
  });

  it("falls back to defaults for malformed values", () => {
    expect(parse("minPrice=abc&guests=99&sort=cheapest&page=-3")).toEqual(
      DEFAULT_FILTERS
    );
  });

  it("swaps an inverted price range", () => {
    const filters = parse("minPrice=300&maxPrice=100");
    expect([filters.minPrice, filters.maxPrice]).toEqual([100, 300]);
  });
});

describe("toSearchParams", () => {
  it("omits defaults", () => {
    expect(toSearchParams(DEFAULT_FILTERS).toString()).toBe("");
  });

  it("round-trips through parseFilters", () => {
    const filters = {
      ...DEFAULT_FILTERS,
      city: "Mexico City",
      guests: 2,
      sort: "rating" as const,
    };
    expect(parseFilters(toSearchParams(filters))).toEqual(filters);
  });
});

describe("updateFilters", () => {
  it("resets to page 1 when a filter changes", () => {
    expect(
      updateFilters({ ...DEFAULT_FILTERS, page: 4 }, { guests: 2 }).page
    ).toBe(1);
  });

  it("keeps other filters when only the page changes", () => {
    const current = { ...DEFAULT_FILTERS, city: "Kyoto" };
    expect(updateFilters(current, { page: 3 })).toEqual({
      ...current,
      page: 3,
    });
  });
});
