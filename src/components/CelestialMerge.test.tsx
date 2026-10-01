// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { CelestialMerge } from "./CelestialMerge";

vi.mock("../game/rendering/draw", () => ({
  drawBoard: vi.fn(),
  drawCelestialBody: vi.fn(),
}));

let cancelFrame: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    setTransform: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    clearRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  cancelFrame = vi.fn();
  vi.stubGlobal("cancelAnimationFrame", cancelFrame);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("CelestialMerge", () => {
  test("cancels the pending animation frame on unmount", () => {
    // Arrange
    const { unmount } = render(<CelestialMerge />);

    // Assert
    expect(cancelFrame).not.toHaveBeenCalled();

    // Act
    unmount();

    // Assert
    expect(cancelFrame).toHaveBeenCalledExactlyOnceWith(1);
  });
});
