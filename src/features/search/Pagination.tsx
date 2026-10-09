import { Link } from "react-router-dom";
import { toSearchParams } from "../../domain/search";
import { pageNumbers } from "./pageNumbers";
import styles from "./Pagination.module.css";
import type { SearchFilters } from "../../lib/types";

interface PaginationProps {
  filters: SearchFilters;
  totalPages: number;
}

export function Pagination({ filters, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = filters.page;
  const isFirstPage = current === 1;
  const isLastPage = current === totalPages;

  const getHref = (page: number) => `?${toSearchParams({ ...filters, page })}`;

  return (
    <nav aria-label="Pagination" className={styles.pagination}>
      {isFirstPage ? (
        <span className={styles.step} aria-hidden="true">
          Previous
        </span>
      ) : (
        <Link to={getHref(current - 1)} className={styles.step}>
          Previous
        </Link>
      )}

      <ol className={styles.pages}>
        {pageNumbers(current, totalPages).map((page, index) => {
          if (page === "gap") {
            return (
              <li
                key={`gap-${index}`}
                aria-hidden="true"
                className={styles.gap}
              >
                …
              </li>
            );
          }

          return (
            <li key={page}>
              <Link
                to={getHref(page)}
                className={styles.page}
                aria-current={page === current ? "page" : undefined}
                aria-label={`Page ${page}`}
              >
                {page}
              </Link>
            </li>
          );
        })}
      </ol>

      {isLastPage ? (
        <span className={styles.step} aria-hidden="true">
          Next
        </span>
      ) : (
        <Link to={getHref(current + 1)} className={styles.step}>
          Next
        </Link>
      )}
    </nav>
  );
}
