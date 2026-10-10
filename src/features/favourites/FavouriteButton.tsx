import { memo } from "react";
import { toggleFavourite } from "./favourites";
import styles from "./FavouriteButton.module.css";

interface FavouriteButtonProps {
  listingId: string;
  title: string;
  isFavourite: boolean;
  className?: string;
}

export const FavouriteButton = memo(function FavouriteButton({
  listingId,
  title,
  isFavourite,
  className,
}: FavouriteButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${className ?? ""}`}
      aria-pressed={isFavourite}
      aria-label={isFavourite ? `Remove ${title} from saved` : `Save ${title}`}
      onClick={() => toggleFavourite(listingId)}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M12 21s-7.5-4.6-9.5-9.2C1.1 8.4 3.2 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5c3.4 0 5.5 3.4 4.1 6.8C19.5 16.4 12 21 12 21z"
          fill={isFavourite ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
});
