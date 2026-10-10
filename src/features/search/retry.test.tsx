import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { server } from "../../mocks/node";
import { renderApp } from "../../test/renderApp";
import { afterEach, describe, expect, it, vi } from "vitest";

const down = () => HttpResponse.json({ message: "down" }, { status: 503 });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("search retry", () => {
  it("shows loading feedback while the retry is in flight, then the results", async () => {
    let calls = 0;
    server.use(
      http.get("*/api/listings", async () => {
        calls += 1;
        if (calls === 1) return down();
        await delay(150); // long enough to see the in-flight state
        return undefined; // fall through to the default handler
      })
    );
    const user = userEvent.setup();
    renderApp("/");

    await user.click(await screen.findByRole("button", { name: "Try again" }));

    // A query with no data goes back to "pending" on retry, so the skeleton
    // replaces the error and the old button cannot be clicked twice.
    expect(await screen.findByLabelText("Loading homes")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" })
    ).not.toBeInTheDocument();

    expect(
      await screen.findByText(/Showing 1–20 of 225 homes/)
    ).toBeInTheDocument();
    expect(calls).toBe(2);
  });

  it("keeps the loaded homes when the next page fails", async () => {
    // Pretend the sentinel is always on screen so the next page loads at once.
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          queueMicrotask(() =>
            callback(
              [{ isIntersecting: true } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver
            )
          );
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    let page2Calls = 0;
    server.use(
      http.get("*/api/listings", async ({ request }) => {
        if (new URL(request.url).searchParams.get("page") !== "2") {
          return undefined;
        }
        page2Calls += 1;
        if (page2Calls === 1) return down();
        await delay(150); // long enough to see the in-flight state
        return undefined;
      })
    );
    const user = userEvent.setup();
    renderApp("/");

    expect(
      await screen.findByText("We could not load more homes.")
    ).toBeInTheDocument();
    // The first page is still on screen and the full-page error is not shown.
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
    expect(screen.queryByText("We could not load homes")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    // The error keeps its status while it refetches, so the button must show it.
    const busy = await screen.findByRole("button", { name: "Retrying…" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");

    await waitFor(() =>
      expect(
        screen.queryByText("We could not load more homes.")
      ).not.toBeInTheDocument()
    );
    expect(page2Calls).toBeGreaterThanOrEqual(2);
  });
});
