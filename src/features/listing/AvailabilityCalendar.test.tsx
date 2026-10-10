/**
 * Tests for the availability calendar on its own: month paging, keyboard paging and the
 * first focusable day. jsdom has no matchMedia, so one month shows unless a test adds it.
 */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_RANGE } from "../../domain/dates";
import { AvailabilityCalendar } from "./AvailabilityCalendar";

const MONTHS = ["2026-10", "2026-11", "2026-12"];

function renderCalendar(onReject = vi.fn()) {
  render(
    <AvailabilityCalendar
      months={MONTHS}
      today="2026-10-09"
      lastDay="2026-12-31"
      bookedDates={new Set(["2026-10-15"])}
      range={EMPTY_RANGE}
      onSelect={vi.fn()}
      onReject={onReject}
    />
  );
  return { onReject };
}

const dayButton = (date: string) => {
  const button = document.querySelector<HTMLButtonElement>(`[data-day="${date}"]`);
  if (!button) throw new Error(`No button for ${date}`);
  return button;
};

afterEach(() => {
  // Remove the matchMedia stub a test may have added.
  Reflect.deleteProperty(window, "matchMedia");
});

describe("availability calendar paging", () => {
  it("shows one month and disables the buttons at each end", async () => {
    const user = userEvent.setup();
    renderCalendar();

    const previous = screen.getByRole("button", { name: "Show previous month" });
    const next = screen.getByRole("button", { name: "Show next month" });
    expect(screen.getAllByRole("grid")).toHaveLength(1);
    expect(screen.getByRole("grid", { name: "October 2026" })).toBeInTheDocument();
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();

    await user.click(next);
    expect(screen.getByRole("grid", { name: "November 2026" })).toBeInTheDocument();
    expect(previous).toBeEnabled();

    await user.click(next);
    expect(screen.getByRole("grid", { name: "December 2026" })).toBeInTheDocument();
    expect(next).toBeDisabled();

    await user.click(previous);
    expect(screen.getByRole("grid", { name: "November 2026" })).toBeInTheDocument();
  });

  it("shows two months on a wide screen", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    renderCalendar();

    expect(screen.getAllByRole("grid")).toHaveLength(2);
    // On the last page the second month is the final one, so "next" is disabled.
    expect(screen.getByRole("button", { name: "Show next month" })).toBeEnabled();
  });

  it("starts keyboard focus on today, not on a past day", () => {
    renderCalendar();

    expect(dayButton("2026-10-09")).toHaveAttribute("tabindex", "0");
    expect(dayButton("2026-10-01")).toHaveAttribute("tabindex", "-1");
  });

  it("pages to the next month when PageDown moves focus into it", async () => {
    const user = userEvent.setup();
    renderCalendar();

    act(() => dayButton("2026-10-09").focus());
    await user.keyboard("{PageDown}");

    expect(screen.getByRole("grid", { name: "November 2026" })).toBeInTheDocument();
    expect(dayButton("2026-11-09")).toHaveFocus();
    expect(screen.getByRole("button", { name: "Show previous month" })).toBeEnabled();
  });

  it("uses the first bookable day as the Tab stop after paging with the buttons", async () => {
    const user = userEvent.setup();
    renderCalendar();

    await user.click(screen.getByRole("button", { name: "Show next month" }));

    expect(dayButton("2026-11-01")).toHaveAttribute("tabindex", "0");
  });

  it("reports a click on a booked day", async () => {
    const user = userEvent.setup();
    const { onReject } = renderCalendar();

    await user.click(dayButton("2026-10-15"));

    expect(onReject).toHaveBeenCalledWith("2026-10-15");
  });
});
