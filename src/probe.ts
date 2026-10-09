// ...existing code...
import { setupServer } from "msw/node";
import { handlers, mockConfig } from "./mocks/handlers";
import { listings } from "./mocks/data";

/**
 * Manual probe utility — does NOT run automatically on import.
 * Call runProbe() from a script or set RUN_PROBE=1 when running node to execute.
 */
export async function runProbe() {
  mockConfig.minLatency = 0;
  mockConfig.maxLatency = 0;
  mockConfig.failureRate = 0;
  mockConfig.conflictRate = 0;

  const server = setupServer(...handlers);
  // Be explicit about unhandled requests so probes surface missing handlers.
  server.listen({ onUnhandledFrame: "error" as const });

  // Resolve a usable fetch implementation for Node/TS environments.
  let fetchFn: typeof fetch;
  if (typeof globalThis.fetch === "function") {
    fetchFn = globalThis.fetch.bind(globalThis) as unknown as typeof fetch;
  } else {
    // Try to lazy-import a Node fetch implementation (undici preferred).
    try {
      // undici exports fetch
      // @ts-ignore - dynamic import types may vary
      const undici = await import("undici");
      fetchFn = undici.fetch as unknown as typeof fetch;
    } catch {
      try {
        // node-fetch v3 exports a default function
        // @ts-ignore
        const nodeFetch = await import("node-fetch");
        // node-fetch default or named export fallback
        fetchFn = (nodeFetch.default ?? nodeFetch) as unknown as typeof fetch;
      } catch {
        server.close();
        throw new Error(
          "No global fetch available. Install 'undici' or 'node-fetch', or run on Node 18+"
        );
      }
    }
  }

  try {
    const id = listings[0].id;
    const res = await fetchFn("http://localhost/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: id,
        checkIn: "2026-12-20",
        checkOut: "2026-12-22",
        guests: 1,
        name: "Test User",
        email: "a@b.com",
      }),
    });
    console.log(res.status, await res.text());
  } finally {
    server.close();
  }
}

// Optional: run only when explicitly requested via env var
if (import.meta.env.VITE_RUN_PROBE === "1") {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  runProbe();
}
// ...existing code...
