import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import type { Listing } from "../../api/schemas";
import { calculatePrice } from "../../domain/pricing";
import { formatCents } from "../../lib/format";
import { listings } from "../../mocks/data";
import { markBooked, setFixedBookings } from "../../mocks/db";
import { server } from "../../mocks/node";
import { renderApp } from "../../test/renderApp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const [listing] = listings as [Listing, ...Listing[]];

// Only Date is faked; real timers keep user-event and MSW working normally.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-09T10:00:00"));
});

afterEach(() => {
  vi.useRealTimers();
});

const day = (label: string) =>
  screen.getByRole("button", { name: new RegExp(`^${label}`) });

async function openListing() {
  renderApp(`/listings/${listing.id}`);
  await screen.findByRole("heading", { level: 1, name: listing.title });
  await screen.findByRole("grid", { name: "October 2026" });
}

async function fillGuestDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Full name"), "Ana Silva");
  await user.type(screen.getByLabelText("Email"), "ana@example.com");
}

describe("booking flow", () => {
  it("books a stay and shows the confirmation", async () => {
    setFixedBookings(listing.id, ["2026-10-15"]);
    const user = userEvent.setup();
    await openListing();

    await user.click(day("Monday, October 12, 2026"));
    await user.click(day("Wednesday, October 14, 2026"));

    const total = formatCents(calculatePrice(listing.pricePerNight, 2).total);
    const panel = screen.getByRole("complementary");
    expect(within(panel).getByText(total)).toBeInTheDocument();

    await fillGuestDetails(user);
    await user.click(screen.getByRole("button", { name: "Book now" }));

    expect(
      await screen.findByRole("heading", {
        name: `You are going to ${listing.city}!`,
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Mon, Oct 12, 2026")).toBeInTheDocument();
    expect(screen.getByText("2 nights, 1 guest")).toBeInTheDocument();
    expect(screen.getByText(total)).toBeInTheDocument();
  });

  it("does not let a range cross a booked night", async () => {
    setFixedBookings(listing.id, ["2026-10-15"]);
    const user = userEvent.setup();
    await openListing();

    await user.click(day("Tuesday, October 13, 2026"));

    expect(day("Thursday, October 15, 2026")).toHaveAttribute(
      "aria-disabled",
      "false"
    );
    expect(day("Saturday, October 17, 2026")).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });

  it("shows inline errors and does not submit invalid details", async () => {
    setFixedBookings(listing.id, []);
    const user = userEvent.setup();
    await openListing();

    await user.click(screen.getByRole("button", { name: "Book now" }));

    expect(screen.getByLabelText("Full name")).toHaveAccessibleDescription(
      "Enter your full name."
    );
    expect(screen.getByLabelText("Full name")).toHaveFocus();
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  it("explains a 409 conflict, refreshes availability and lets the guest rebook", async () => {
    setFixedBookings(listing.id, ["2026-10-20"]);
    server.use(
      // Another guest takes the 12th just before our request lands. Returning nothing hands
      // the request on to the real handler, which then answers with a 409.
      http.post(
        "*/api/bookings",
        () => markBooked(listing.id, ["2026-10-12"]),
        { once: true }
      )
    );

    const user = userEvent.setup();
    await openListing();

    await user.click(day("Monday, October 12, 2026"));
    await user.click(day("Wednesday, October 14, 2026"));
    await fillGuestDetails(user);
    await user.click(screen.getByRole("button", { name: "Book now" }));

    expect(
      await screen.findByText(/another guest booked some of those nights/i)
    ).toBeVisible();
    await waitFor(() =>
      expect(day("Monday, October 12, 2026")).toHaveAccessibleName(/booked/)
    );
    expect(day("Monday, October 12, 2026")).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    expect(screen.getAllByText("Add date")).toHaveLength(2);
    // The guest's details are kept so they only need to pick new dates.
    expect(screen.getByLabelText("Full name")).toHaveValue("Ana Silva");

    await user.click(day("Friday, October 16, 2026"));
    await user.click(day("Sunday, October 18, 2026"));
    await user.click(screen.getByRole("button", { name: "Book now" }));

    expect(
      await screen.findByRole("heading", {
        name: `You are going to ${listing.city}!`,
      })
    ).toBeInTheDocument();
  });

  it("shows a not found page for an unknown listing", async () => {
    renderApp("/listings/nope");
    expect(
      await screen.findByRole("heading", { name: "Page not found" })
    ).toBeInTheDocument();
  });
});
