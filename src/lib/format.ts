import { format, parseISO } from "date-fns";
import type { IsoDate } from "../domain/dates";
import { type SortOption } from "../domain/search";
import { MAX_GUESTS } from "./types";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatCents = (cents: number) => usd.format(cents / 100);

export const formatUsd = (dollars: number) =>
  Number.isInteger(dollars) ? usdWhole.format(dollars) : usd.format(dollars);

export const formatDate = (date: IsoDate) =>
  format(parseISO(date), "EEE, MMM d, yyyy");

export const formatShortDate = (date: IsoDate) =>
  format(parseISO(date), "MMM d");

export const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

//sort labels for the search filters
export const SORT_LABELS: Record<SortOption, string> = {
  recommended: "Recommended",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Top rated",
};
//fake data
export const GUEST_OPTIONS = Array.from(
  { length: MAX_GUESTS },
  (_, i) => i + 1
);
