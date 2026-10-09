import { describe, expect, it } from "vitest";
import { calculatePrice } from "./pricing";

describe("calculatePrice", () => {
  it("adds a flat cleaning fee and 10% service fee on the nightly subtotal", () => {
    expect(calculatePrice(120, 3)).toEqual({
      nights: 3,
      nightlyRate: 12000,
      subtotal: 36000,
      cleaningFee: 4000,
      serviceFee: 3600,
      total: 43600,
    });
  });

  it("charges the cleaning fee once for a single night", () => {
    expect(calculatePrice(85, 1).total).toBe(8500 + 4000 + 850);
  });

  it("rounds the service fee to the nearest cent", () => {
    // 3 x $33.35 = $100.05, 10% = $10.005
    const price = calculatePrice(33.35, 3);
    expect(price.subtotal).toBe(10005);
    expect(price.serviceFee).toBe(1001);
  });

  it("avoids floating point drift on fractional prices", () => {
    expect(calculatePrice(0.1, 3).subtotal).toBe(30);
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects %s nights", (nights) => {
    expect(() => calculatePrice(100, nights)).toThrow(RangeError);
  });

  it("rejects a negative nightly price", () => {
    expect(() => calculatePrice(-5, 2)).toThrow(RangeError);
  });
});
