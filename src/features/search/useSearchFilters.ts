import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  parseFilters,
  toSearchParams,
  updateFilters,
} from "../../domain/search";
import type { SearchFilters } from "../../lib/types";

export function useSearchFilters() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);

  const setFilters = useCallback(
    (patch: Partial<SearchFilters>) => {
      setParams((current) =>
        toSearchParams(updateFilters(parseFilters(current), patch))
      );
    },
    [setParams]
  );

  return [filters, setFilters] as const;
}
