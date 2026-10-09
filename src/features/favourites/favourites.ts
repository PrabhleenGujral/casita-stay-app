import { useSyncExternalStore } from "react";

const STORAGE_KEY = "casita.favourites";

// saved list changes.
const listeners = new Set<() => void>();

// Reads the saved ids from localStorage.
function loadFavourites(): ReadonlySet<string> {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]"
    );
    if (!Array.isArray(stored)) return new Set();

    return new Set(stored.filter((id) => typeof id === "string"));
  } catch {
    return new Set();
  }
}

let favourites = loadFavourites();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

// Another browser tab changed the list, so reload it here too.
function handleStorageEvent(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;

  favourites = loadFavourites();
  notifyListeners();
}

function subscribe(listener: () => void) {
  // Only listen to other tabs while at least one component is using the list.
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorageEvent);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

export function toggleFavourite(id: string) {
  const updated = new Set(favourites);
  if (updated.has(id)) {
    updated.delete(id);
  } else {
    updated.add(id);
  }
  favourites = updated;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...updated]));
  } catch {
    //  Saving still works until the tab is closed.
  }
  notifyListeners();
}

// The saved listing ids in localstorage
export function useFavourites() {
  return useSyncExternalStore(subscribe, () => favourites);
}
