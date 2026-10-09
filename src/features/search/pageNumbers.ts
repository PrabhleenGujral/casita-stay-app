/** Page numbers to show: first, last, and a window around the current page. */
export function pageNumbers(current: number, total: number): (number | 'gap')[] {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  return sorted.flatMap((page, i) => {
    const previous = sorted[i - 1];
    return previous !== undefined && page - previous > 1 ? ['gap' as const, page] : [page];
  });
}
