import { describe, expect, it } from "vitest";
import { validateGuestDetails } from "./guestDetails";

const valid = { name: "Ana Silva", email: "ana@example.com", guests: 2 };

describe("validateGuestDetails", () => {
  it("accepts valid details", () => {
    expect(validateGuestDetails(valid, 4)).toEqual({});
  });

  it("requires a name that is not just whitespace", () => {
    expect(validateGuestDetails({ ...valid, name: "   " }, 4).name).toBe(
      "Enter your full name."
    );
  });

  it.each(["ana", "ana@", "ana@example", "ana @example.com"])(
    "rejects email %s",
    (email) => {
      expect(validateGuestDetails({ ...valid, email }, 4).email).toBeDefined();
    }
  );

  it("rejects more guests than the home fits", () => {
    expect(validateGuestDetails({ ...valid, guests: 5 }, 4).guests).toBe(
      "This home fits up to 4 guests."
    );
  });

  it("rejects zero guests", () => {
    expect(
      validateGuestDetails({ ...valid, guests: 0 }, 4).guests
    ).toBeDefined();
  });
});
