import { describe, expect, it } from "vitest";
import type { ListingPage, ListingSummary } from "../../api/schemas";
import { mergePages } from "./mergePages";

function home(id: string): ListingSummary {
  return { id } as ListingSummary;
}

function page(pageNumber: number, ids: string[]): ListingPage {
  return {
    items: ids.map(home),
    total: 6,
    page: pageNumber,
    pageSize: 2,
  } as ListingPage;
}

describe("mergePages", () => {
  it("keeps earlier pages when later pages are loaded", () => {
    const first = mergePages([page(1, ["a", "b"])]);
    const more = mergePages([page(1, ["a", "b"]), page(2, ["c", "d"])]);

    expect(first.map((h) => h.id)).toEqual(["a", "b"]);
    // Scrolling back up must still find the first page.
    expect(more.map((h) => h.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("does not repeat a home that appears on two pages", () => {
    const merged = mergePages([page(1, ["a", "b"]), page(2, ["b", "c"])]);
    expect(merged.map((h) => h.id)).toEqual(["a", "b", "c"]);
  });

  it("returns an empty list when nothing is loaded", () => {
    expect(mergePages([])).toEqual([]);
  });
});
