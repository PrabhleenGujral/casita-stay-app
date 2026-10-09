import type { SortOption } from "../../domain/search";
import { CITIES, SORT_OPTIONS } from "../../domain/search";
import { GUEST_OPTIONS, SORT_LABELS } from "../../lib/format";
import { DEFAULT_FILTERS } from "../../lib/types";
import { DebouncedInput } from "./DebouncedInput";
import type { SearchFilters } from "../../lib/types";
import styles from "./Filters.module.css";

interface FiltersProps {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
}

export function Filters({ filters, onChange }: FiltersProps) {
  const hasFilters =
    filters.city !== DEFAULT_FILTERS.city ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.guests !== null;

  const clearFilters = () =>
    onChange({ city: "", minPrice: null, maxPrice: null, guests: null });

  return (
    <form
      role="search"
      aria-label="Filter homes"
      className={styles.filters}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className={`${styles.field} ${styles.city}`}>
        <label htmlFor="filter-city">Where</label>
        <DebouncedInput
          id="filter-city"
          type="search"
          list="city-options"
          placeholder="Any city"
          autoComplete="off"
          value={filters.city}
          onCommit={(city) => onChange({ city: city.trim() })}
        />
        <datalist id="city-options">
          {CITIES.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </div>

      <fieldset className={styles.price}>
        <legend>Price per night (USD)</legend>
        <div className={styles.priceInputs}>
          <div className={styles.field}>
            <label htmlFor="filter-min-price" className="visually-hidden">
              Minimum price
            </label>
            <DebouncedInput
              id="filter-min-price"
              type="number"
              inputMode="numeric"
              min="0"
              step="0.01"
              placeholder="Min"
              value={
                filters.minPrice != null
                  ? (filters.minPrice / 100).toString()
                  : ""
              }
              onCommit={(value) => {
                const trimmed = value.trim();
                if (trimmed === "") {
                  onChange({ minPrice: null });
                } else {
                  const dollars = Number(trimmed);
                  if (!Number.isNaN(dollars) && dollars >= 0) {
                    const cents = Math.round(dollars * 100);
                    onChange({ minPrice: cents });
                  }
                }
              }}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="filter-max-price" className="visually-hidden">
              Maximum price
            </label>
            <DebouncedInput
              id="filter-max-price"
              type="number"
              inputMode="numeric"
              min="0"
              step="0.01"
              placeholder="Max"
              value={
                filters.maxPrice != null
                  ? (filters.maxPrice / 100).toString()
                  : ""
              }
              onCommit={(value) => {
                const trimmed = value.trim();
                if (trimmed === "") {
                  onChange({ maxPrice: null });
                } else {
                  const dollars = Number(trimmed);
                  if (!Number.isNaN(dollars) && dollars >= 0) {
                    const cents = Math.round(dollars * 100);
                    onChange({ maxPrice: cents });
                  }
                }
              }}
            />
          </div>
        </div>
      </fieldset>

      {/* <fieldset className={styles.price}>
        <legend>Price per night (USD)</legend>
        <div className={styles.priceInputs}>
          <div className={styles.field}>
            <label htmlFor="filter-min-price" className="visually-hidden">
              Minimum price
            </label>
            <DebouncedInput
              id="filter-min-price"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Min"
              value={filters.minPrice?.toString() ?? ""}
              onCommit={(value) => onChange({ minPrice: toPrice(value) })}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="filter-max-price" className="visually-hidden">
              Maximum price
            </label>
            <DebouncedInput
              id="filter-max-price"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Max"
              value={filters.maxPrice?.toString() ?? ""}
              onCommit={(value) => onChange({ maxPrice: toPrice(value) })}
            />
          </div>
        </div>
      </fieldset> */}

      <div className={styles.field}>
        <label htmlFor="filter-guests">Guests</label>
        <select
          id="filter-guests"
          value={filters.guests ?? ""}
          onChange={(event) =>
            onChange({
              guests: event.target.value ? Number(event.target.value) : null,
            })
          }
        >
          <option value="">Any</option>
          {GUEST_OPTIONS?.map((count) => (
            <option key={count} value={count}>
              {count}+
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="filter-sort">Sort by</label>
        <select
          id="filter-sort"
          value={filters.sort}
          onChange={(event) =>
            onChange({ sort: event.target.value as SortOption })
          }
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SORT_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          type="button"
          className={`button button-secondary ${styles.clear}`}
          onClick={clearFilters}
        >
          Clear filters
        </button>
      )}
    </form>
  );
}
