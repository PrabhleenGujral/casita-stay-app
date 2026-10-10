/**
 * Tests for the favourite (save) button: its accessible name follows its state.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FavouriteButton } from "./FavouriteButton";
import { useFavourites } from "./favourites";

describe("FavouriteButton", () => {
  it("offers to save a home that is not saved", () => {
    render(<FavouriteButton listingId="a" title="Sunny loft" isFavourite={false} />);

    const button = screen.getByRole("button", { name: "Save Sunny loft" });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("offers to remove a saved home", () => {
    render(<FavouriteButton listingId="a" title="Sunny loft" isFavourite />);

    const button = screen.getByRole("button", { name: "Remove Sunny loft from saved" });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("changes its name when pressed and changes back when pressed again", async () => {
    const user = userEvent.setup();
    function Connected() {
      const favourites = useFavourites();
      return (
        <FavouriteButton
          listingId="toggle-test"
          title="Sunny loft"
          isFavourite={favourites.has("toggle-test")}
        />
      );
    }
    render(<Connected />);

    await user.click(screen.getByRole("button", { name: "Save Sunny loft" }));
    await user.click(
      screen.getByRole("button", { name: "Remove Sunny loft from saved" })
    );
    expect(screen.getByRole("button", { name: "Save Sunny loft" })).toBeInTheDocument();
  });
});
