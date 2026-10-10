import type { ListingSummary } from "../api/schemas";
import type { DateRange, IsoDate } from "../domain/dates";
import type { SortOption } from "../domain/search";
//availability calendar props
export interface AvailabilityCalendarProps {
  months: string[];
  today: IsoDate;
  lastDay: IsoDate;
  bookedDates: ReadonlySet<IsoDate>;
  range: DateRange;
  onSelect: (day: IsoDate) => void;
  onReject?: (day: IsoDate) => void;
}
//listing card props
export interface ListingCardProps {
  listing: ListingSummary;
  isFavourite: boolean;
  priority?: boolean;
  onPrefetch?: (id: string) => void;
}

export const MAX_GUESTS = 10;

export interface SearchFilters {
  city: string;
  minPrice: number | null;
  maxPrice: number | null;
  guests: number | null;
  sort: SortOption;
  page: number;
}

export const DEFAULT_FILTERS: SearchFilters = {
  city: "",
  minPrice: null,
  maxPrice: null,
  guests: null,
  sort: "recommended",
  page: 1,
};

export const SKELETON_COUNT = 8;
export const PRIORITY_IMAGES = 4;
