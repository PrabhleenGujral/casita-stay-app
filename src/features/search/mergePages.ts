import type { ListingPage, ListingSummary } from "../../api/schemas";

export function mergePages(pages: ListingPage[]): ListingSummary[] {
  const seen = new Set<string>();
  const items: ListingSummary[] = [];
  for (const page of pages) {
    for (const item of page.items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        items.push(item);
      }
    }
  }
  return items;
}
