import { memo } from "react";
import type { ListingSummary } from "../../api/schemas";
import { ListingCard } from "./ListingCard";
import styles from "./VirtualizedGrid.module.css";

interface VirtualizedGridProps {
  items: ListingSummary[];
  isFavourites: ReadonlySet<string>;
  isPlaceholderData: boolean;
  onPrefetch?: (id: string) => void;
}

const GridItem = memo(
  ({
    listing,
    isFavourite,
    index,
    onPrefetch,
  }: {
    listing: ListingSummary;
    isFavourite: boolean;
    index: number;
    onPrefetch?: (id: string) => void;
  }) => (
    <li className={styles.item}>
      <ListingCard
        listing={listing}
        isFavourite={isFavourite}
        priority={index < 4}
        onPrefetch={onPrefetch}
      />
    </li>
  )
);

GridItem.displayName = "GridItem";

export const VirtualizedGrid = memo(function VirtualizedGrid({
  items,
  isFavourites,
  isPlaceholderData,
  onPrefetch,
}: VirtualizedGridProps) {
  return (
    <ul
      className={styles.grid}
      aria-busy={isPlaceholderData}
      data-stale={isPlaceholderData || undefined}
    >
      {items.map((listing, index) => (
        <GridItem
          key={listing.id}
          listing={listing}
          isFavourite={isFavourites.has(listing.id)}
          index={index}
          onPrefetch={onPrefetch}
        />
      ))}
    </ul>
  );
});
