import { describe, expect, it } from "vitest";
import {
  isSelectable,
  nextBookedDate,
  selectDay,
  stayNights,
  upcomingMonths,
  validateRange,
  windowEnd,
} from "./dates";

const none = new Set<string>();

describe("validateRange", () => {
  it("accepts a free range and counts nights", () => {
    expect(validateRange("2026-10-10", "2026-10-13", none)).toEqual({
      ok: true,
      nights: 3,
    });
  });

  it("rejects a same-day range", () => {
    expect(validateRange("2026-10-10", "2026-10-10", none)).toEqual({
      ok: false,
      error: "same-day",
    });
  });

  it("rejects a check-out before check-in", () => {
    expect(validateRange("2026-10-12", "2026-10-10", none)).toEqual({
      ok: false,
      error: "checkout-before-checkin",
    });
  });

  it("rejects a range that crosses a booked night", () => {
    const booked = new Set(["2026-10-11"]);
    expect(validateRange("2026-10-10", "2026-10-13", booked)).toEqual({
      ok: false,
      error: "booked-night",
    });
  });

  it("rejects a range that starts on a booked night", () => {
    const booked = new Set(["2026-10-10"]);
    expect(validateRange("2026-10-10", "2026-10-12", booked).ok).toBe(false);
  });

  it("allows checking out on a booked date", () => {
    const booked = new Set(["2026-10-13"]);
    expect(validateRange("2026-10-10", "2026-10-13", booked)).toEqual({
      ok: true,
      nights: 3,
    });
  });

  it("counts nights across a month boundary", () => {
    expect(validateRange("2026-10-30", "2026-11-02", none)).toEqual({
      ok: true,
      nights: 3,
    });
  });

  it("catches a booked night on the first of the next month", () => {
    const booked = new Set(["2026-11-01"]);
    expect(validateRange("2026-10-30", "2026-11-02", booked).ok).toBe(false);
  });

  it("handles a leap day", () => {
    expect(validateRange("2028-02-28", "2028-03-01", none)).toEqual({
      ok: true,
      nights: 2,
    });
  });

  it("counts calendar nights across a DST change", () => {
    // Clocks change in many timezones on the first Sunday of November.
    expect(validateRange("2026-10-31", "2026-11-03", none)).toEqual({
      ok: true,
      nights: 3,
    });
  });

  it("rejects a check-in in the past when today is given", () => {
    expect(
      validateRange("2026-10-08", "2026-10-10", none, "2026-10-09")
    ).toEqual({
      ok: false,
      error: "in-past",
    });
  });
});

describe("stayNights", () => {
  it("lists every night except the check-out day", () => {
    expect(stayNights("2026-12-30", "2027-01-02")).toEqual([
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
    ]);
  });
});

describe("nextBookedDate", () => {
  it("finds the closest booked date after check-in regardless of set order", () => {
    const booked = new Set(["2026-11-20", "2026-10-01", "2026-10-15"]);
    expect(nextBookedDate("2026-10-10", booked)).toBe("2026-10-15");
  });

  it("returns null when nothing is booked afterwards", () => {
    expect(nextBookedDate("2026-10-10", new Set(["2026-10-01"]))).toBeNull();
  });
});

describe("selectDay", () => {
  const booked = new Set(["2026-10-15"]);

  it("sets check-in first, then check-out", () => {
    const first = selectDay(
      { checkIn: null, checkOut: null },
      "2026-10-10",
      booked
    );
    expect(first).toEqual({ checkIn: "2026-10-10", checkOut: null });
    expect(selectDay(first, "2026-10-12", booked)).toEqual({
      checkIn: "2026-10-10",
      checkOut: "2026-10-12",
    });
  });

  it("starts over when clicking the check-in day again", () => {
    const range = { checkIn: "2026-10-10", checkOut: null };
    expect(selectDay(range, "2026-10-10", booked)).toEqual(range);
  });

  it("starts over when clicking before check-in", () => {
    expect(
      selectDay({ checkIn: "2026-10-10", checkOut: null }, "2026-10-05", booked)
    ).toEqual({
      checkIn: "2026-10-05",
      checkOut: null,
    });
  });

  it("starts over after a complete range", () => {
    const range = { checkIn: "2026-10-10", checkOut: "2026-10-12" };
    expect(selectDay(range, "2026-10-20", booked)).toEqual({
      checkIn: "2026-10-20",
      checkOut: null,
    });
  });

  it("does not complete a range that crosses a booked night", () => {
    const range = { checkIn: "2026-10-10", checkOut: null };
    expect(selectDay(range, "2026-10-17", booked)).toEqual({
      checkIn: "2026-10-17",
      checkOut: null,
    });
  });

  it("never starts a stay on a booked night", () => {
    const range = { checkIn: null, checkOut: null };
    expect(selectDay(range, "2026-10-15", booked)).toBe(range);
  });

  it("lets the booked date be the check-out", () => {
    const range = { checkIn: "2026-10-12", checkOut: null };
    expect(selectDay(range, "2026-10-15", booked)).toEqual({
      checkIn: "2026-10-12",
      checkOut: "2026-10-15",
    });
  });
});

describe("isSelectable", () => {
  const base = {
    bookedDates: new Set(["2026-10-15", "2026-10-16"]),
    today: "2026-10-09",
    lastDay: "2026-12-31",
  };
  const empty = { checkIn: null, checkOut: null };

  it("blocks past days and days after the window", () => {
    expect(isSelectable("2026-10-08", { ...base, range: empty })).toBe(false);
    expect(isSelectable("2027-01-01", { ...base, range: empty })).toBe(false);
    expect(isSelectable("2026-10-09", { ...base, range: empty })).toBe(true);
  });

  it("blocks booked days as check-in", () => {
    expect(isSelectable("2026-10-15", { ...base, range: empty })).toBe(false);
  });

  it("while picking check-out, allows up to the first booked date and nothing past it", () => {
    const range = { checkIn: "2026-10-12", checkOut: null };
    expect(isSelectable("2026-10-15", { ...base, range })).toBe(true);
    expect(isSelectable("2026-10-17", { ...base, range })).toBe(false);
    expect(isSelectable("2026-10-10", { ...base, range })).toBe(true);
  });
});

describe("booking window", () => {
  it("covers the current month and the next two, across a year boundary", () => {
    expect(upcomingMonths("2026-11-20", 3)).toEqual([
      "2026-11",
      "2026-12",
      "2027-01",
    ]);
    expect(windowEnd("2026-11-20", 3)).toBe("2027-01-31");
  });
});
