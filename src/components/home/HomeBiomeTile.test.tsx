import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import HomeBiomeTile from "./HomeBiomeTile";

describe("HomeBiomeTile", () => {
  it("renders the biome label and meta text", () => {
    render(
      <HomeBiomeTile
        id="space"
        label="SPACE"
        color="#6CE5FF"
        meta="PENTA · 94 BPM"
        hint="Cosmic galaxy"
        visible
        delayMs={0}
        onPreview={vi.fn()}
      />,
    );
    expect(screen.getByText("SPACE")).toBeInTheDocument();
    expect(screen.getByText("PENTA · 94 BPM")).toBeInTheDocument();
  });

  it("fires onPreview when activated by pointer down", () => {
    const onPreview = vi.fn();
    render(
      <HomeBiomeTile
        id="jungle"
        label="JUNGLE"
        color="#3CC38A"
        meta="PENTA · 108 BPM"
        hint="Canopy"
        visible
        delayMs={0}
        onPreview={onPreview}
      />,
    );
    const tile = screen.getByRole("button", { name: /jungle biome/i });
    fireEvent.pointerDown(tile);
    expect(onPreview).toHaveBeenCalledWith("jungle");
  });

  it("fires onPreview on Enter and Space when focused", () => {
    const onPreview = vi.fn();
    render(
      <HomeBiomeTile
        id="sea"
        label="SEA"
        color="#2FA6FF"
        meta="LYDIAN · 76 BPM"
        hint="Reef"
        visible
        delayMs={0}
        onPreview={onPreview}
      />,
    );
    const tile = screen.getByRole("button", { name: /sea biome/i });
    fireEvent.keyDown(tile, { key: "Enter" });
    fireEvent.keyDown(tile, { key: " " });
    expect(onPreview).toHaveBeenCalledTimes(2);
    expect(onPreview).toHaveBeenNthCalledWith(1, "sea");
    expect(onPreview).toHaveBeenNthCalledWith(2, "sea");
  });

  it("is non-interactive while hidden", () => {
    const onPreview = vi.fn();
    render(
      <HomeBiomeTile
        id="cyberpunk"
        label="CYBERPUNK"
        color="#FF2CA8"
        meta="ARABIC · 128 BPM"
        hint="Neon city"
        visible={false}
        delayMs={0}
        onPreview={onPreview}
      />,
    );
    const tile = screen.getByRole("button", { hidden: true });
    expect(tile).toHaveAttribute("tabindex", "-1");
    expect(tile).toHaveAttribute("aria-hidden", "true");
  });
});
