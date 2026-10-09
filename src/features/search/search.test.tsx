import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/node";
import { renderApp } from "../../test/renderApp";
import { describe, expect, it } from "vitest";

describe("search page", () => {
  it("restores filters from the URL", async () => {
    renderApp("/?city=Kyoto&guests=4&sort=price-asc");

    expect(
      await screen.findByText(/Showing 1–\d+ of \d+ homes/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Homes in Kyoto" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Where")).toHaveValue("Kyoto");
    expect(screen.getByLabelText("Guests")).toHaveValue("4");
    expect(screen.getByLabelText("Sort by")).toHaveValue("price-asc");
  });

  it("writes filter changes to the URL and resets to page 1", async () => {
    const user = userEvent.setup();
    const { router } = renderApp("/?page=3");
    await screen.findByText(/Showing 41–60/);

    await user.selectOptions(screen.getByLabelText("Guests"), "6");

    expect(router.state.location.search).toBe("?guests=6");
    expect(await screen.findByText(/Showing 1–/)).toBeInTheDocument();
  });

  it("debounces typing into a single URL update", async () => {
    const user = userEvent.setup();
    const { router } = renderApp("/");
    await screen.findByText(/Showing 1–20/);

    await user.type(screen.getByLabelText("Where"), "Lisbon");
    expect(router.state.location.search).toBe("");

    await waitFor(() =>
      expect(router.state.location.search).toBe("?city=Lisbon")
    );
    expect(router.state.historyAction).toBe("PUSH");
  });

  it("shows an empty state when nothing matches", async () => {
    renderApp("/?city=Atlantis");
    expect(
      await screen.findByText("No homes match your search")
    ).toBeInTheDocument();
  });

  it("shows an error with a working retry", async () => {
    server.use(
      http.get(
        "*/api/listings",
        () => HttpResponse.json({ message: "down" }, { status: 503 }),
        {
          once: true,
        }
      )
    );
    const user = userEvent.setup();
    renderApp("/");

    await user.click(await screen.findByRole("button", { name: "Try again" }));

    expect(
      await screen.findByText(/Showing 1–20 of 225 homes/)
    ).toBeInTheDocument();
  });
});
