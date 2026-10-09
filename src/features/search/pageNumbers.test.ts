import { describe, expect, it } from "vitest";
import { pageNumbers } from "./pageNumbers";

describe("pageNumbers", () => {
  it("shows every page when there are only a few", () => {
    expect(pageNumbers(2, 3)).toEqual([1, 2, 3]);
  });

  it("collapses the middle with gaps", () => {
    expect(pageNumbers(6, 12)).toEqual([1, "gap", 5, 6, 7, "gap", 12]);
  });

  it("does not add a gap between neighbours", () => {
    expect(pageNumbers(1, 12)).toEqual([1, 2, "gap", 12]);
    expect(pageNumbers(12, 12)).toEqual([1, "gap", 11, 12]);
  });
});
