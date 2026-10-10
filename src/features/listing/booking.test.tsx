import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
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

    const total = formatCents(calculatePrice(listing.pricePerNight / 100, 2).total);
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

  it.each([
    [
      "a 400 with a server message",
      HttpResponse.json({ message: "Guest count is too high" }, { status: 400 }),
      "Guest count is too high. Your booking was not made, please try again.",
    ],
    [
      "a 400 without a readable body",
      new HttpResponse("oops", { status: 400 }),
      "Something went wrong while contacting the server. Your booking was not made, please try again.",
    ],
    [
      "a 404",
      HttpResponse.json({ message: "Not found" }, { status: 404 }),
      "This home is no longer available. Your booking was not made, please try again.",
    ],
    [
      "a 500",
      HttpResponse.json({ message: "boom" }, { status: 500 }),
      "We could not reach the booking service. Your booking was not made, please try again.",
    ],
    [
      "a network error",
      HttpResponse.error(),
      "We could not reach the booking service. Your booking was not made, please try again.",
    ],
  ])("shows a friendly message for %s", async (_name, response, expected) => {
    setFixedBookings(listing.id, []);
    server.use(http.post("*/api/bookings", () => response, { once: true }));
    const user = userEvent.setup();
    await openListing();

    await user.click(day("Monday, October 12, 2026"));
    await user.click(day("Wednesday, October 14, 2026"));
    await fillGuestDetails(user);
    await user.click(screen.getByRole("button", { name: "Book now" }));

    expect(await screen.findByText(expected)).toBeInTheDocument();
    expect(screen.queryByText(/Request failed/)).not.toBeInTheDocument();
  });

  it("explains why a range that crosses a booked night cannot be chosen", async () => {
    setFixedBookings(listing.id, ["2026-10-15"]);
    const user = userEvent.setup();
    await openListing();

    await user.click(day("Tuesday, October 13, 2026"));
    await user.click(day("Saturday, October 17, 2026"));

    expect(
      screen.getByText(
        "That range includes booked nights. Choose a check-out on or before Oct 15."
      )
    ).toBeInTheDocument();
    // The guest's check-in is untouched.
    expect(day("Tuesday, October 13, 2026")).toHaveAttribute("aria-pressed", "true");

    // A valid check-out clears the message.
    await user.click(day("Wednesday, October 14, 2026"));
    expect(screen.queryByText(/That range includes booked nights/)).not.toBeInTheDocument();
  });

  it("says a booked or past day is not available, then clears it on a valid pick", async () => {
    setFixedBookings(listing.id, ["2026-10-15"]);
    const user = userEvent.setup();
    await openListing();

    await user.click(day("Thursday, October 15, 2026"));
    expect(screen.getByText("That date is not available.")).toBeInTheDocument();

    await user.click(day("Thursday, October 8, 2026"));
    expect(screen.getByText("That date is not available.")).toBeInTheDocument();

    await user.click(day("Monday, October 12, 2026"));
    expect(screen.queryByText("That date is not available.")).not.toBeInTheDocument();
  });

  it("announces form errors in a summary", async () => {
    setFixedBookings(listing.id, []);
    const user = userEvent.setup();
    await openListing();

    await user.click(screen.getByRole("button", { name: "Book now" }));

    const summary = screen
      .getByText("Please fix the following:")
      .closest('[role="alert"]');
    expect(summary).toBeInstanceOf(HTMLElement);
    if (!(summary instanceof HTMLElement)) return;
    expect(within(summary).getByText("Enter your full name.")).toBeInTheDocument();
    expect(within(summary).getByText("Enter your email address.")).toBeInTheDocument();
  });

  it("shows a not found page for an unknown listing", async () => {
    renderApp("/listings/nope");
    expect(
      await screen.findByRole("heading", { name: "Page not found" })
    ).toBeInTheDocument();
  });
});
