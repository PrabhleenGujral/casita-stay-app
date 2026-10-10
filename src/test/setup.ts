import { beforeAll, afterEach, afterAll } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { mockConfig } from "../mocks/handlers";
import { resetDb } from "../mocks/db";
import { server } from "../mocks/node";

Object.assign(mockConfig, {
  minLatency: 0,
  maxLatency: 0,
  failureRate: 0,
  conflictRate: 0,
});

configure({ asyncUtilTimeout: 3000 });

window.scrollTo = () => {};

class NoopIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly scrollMargin = "";
  readonly thresholds: readonly number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
window.IntersectionObserver = NoopIntersectionObserver;

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
