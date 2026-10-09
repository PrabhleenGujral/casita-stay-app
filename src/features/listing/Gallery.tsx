import type { KeyboardEvent } from "react";
import { useState } from "react";
import styles from "./Gallery.module.css";

interface GalleryProps {
  photos: string[];
  title: string;
}

export function Gallery({ photos, title }: GalleryProps) {
  const [index, setIndex] = useState(0);
  const count = photos.length;

  const showPhoto = (next: number) => setIndex((next + count) % count);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showPhoto(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPhoto(index - 1);
    }
  };

  return (
    <section
      className={styles.gallery}
      aria-roledescription="carousel"
      aria-label={`Photos of ${title}`}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.stage}>
        <img
          src={photos[index]}
          alt={`${title}, ${index + 1} of ${count}`}
          width={1200}
          height={800}
        />

        {count > 1 && (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.previous}`}
              onClick={() => showPhoto(index - 1)}
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.next}`}
              onClick={() => showPhoto(index + 1)}
              aria-label="Next photo"
            >
              ›
            </button>
          </>
        )}

        <p className={styles.counter} aria-live="polite">
          {index + 1} / {count}
        </p>
      </div>

      {count > 1 && (
        <ul className={styles.thumbnails}>
          {photos.map((photo, i) => (
            <li key={photo}>
              <button
                type="button"
                className={styles.thumbnail}
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1} of ${count}`}
                aria-current={i === index}
              >
                <img
                  src={photo}
                  alt=""
                  width={120}
                  height={80}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
