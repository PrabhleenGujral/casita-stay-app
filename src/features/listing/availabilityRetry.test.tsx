import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { Listing } from "../../api/schemas";
import { listings } from "../../mocks/data";
import { server } from "../../mocks/node";
import { renderApp } from "../../test/renderApp";
import { describe, expect, it } from "vitest";

const [listing] = listings as [Listing, ...Listing[]];

describe("availability retry", () => {
  it("refetches only the month that failed", async () => {
    const requests: string[] = [];
    let failedMonth = "";
    server.use(
      http.get("*/api/listings/:id/availability", ({ request }) => {
        const month = new URL(request.url).searchParams.get("month") ?? "";
        requests.push(month);
        // Fail the first month asked for, once.
        if (!failedMonth) {
          failedMonth = month;
          return HttpResponse.json({ message: "down" }, { status: 503 });
        }
        return undefined; // fall through to the default handler
      })
    );
    const user = userEvent.setup();
    renderApp(`/listings/${listing.id}`);

    await user.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findAllByRole("grid")).not.toHaveLength(0);
    expect(screen.queryByText("Availability did not load")).not.toBeInTheDocument();
    // 3 months once each, plus one more request for the month that failed.
    expect(requests).toHaveLength(4);
    expect(requests.filter((month) => month === failedMonth)).toHaveLength(2);
  });
});
