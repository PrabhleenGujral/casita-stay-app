import { useEffect, useState } from "react";

function canMatchMedia() {
  return (
    typeof window !== "undefined" && typeof window.matchMedia === "function"
  );
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (!canMatchMedia()) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (!canMatchMedia()) return;

    const mediaQuery = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQuery.matches);
    updateMatches();
    mediaQuery.addEventListener("change", updateMatches);
    return () => mediaQuery.removeEventListener("change", updateMatches);
  }, [query]);

  return matches;
}
