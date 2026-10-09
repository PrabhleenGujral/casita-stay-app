import { QueryClient } from "@tanstack/react-query";
import { ApiError, InvalidResponseError } from "./client";

const MAX_RETRIES = 2;

// Retry network errors and server errors (5xx).
// A 4xx error or a badly formed response would fail the same way again.
export function shouldRetry(failureCount: number, error: unknown) {
  if (error instanceof InvalidResponseError) return false;
  if (error instanceof ApiError && error.status < 500) return false;

  return failureCount < MAX_RETRIES;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
