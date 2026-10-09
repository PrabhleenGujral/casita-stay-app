import { beforeAll, afterEach, afterAll } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { mockConfig } from "../mocks/handlers";
import { resetDb } from "../mocks/db";
import { server } from "../mocks/node";

// Tests should be fast and deterministic, so the mock API never stalls or fails on its own.
Object.assign(mockConfig, {
  minLatency: 0,
  maxLatency: 0,
  failureRate: 0,
  conflictRate: 0,
});

// The first import of a lazy route is transformed on demand, which can take over a second.
configure({ asyncUtilTimeout: 3000 });

// jsdom does not implement scrolling; ScrollRestoration calls it on every navigation.
window.scrollTo = () => {};

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetDb();
  localStorage.clear();
});

afterAll(() => {
  server.close();
});
// ...existing code...
