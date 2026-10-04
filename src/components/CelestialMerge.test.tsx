// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { CelestialLevel } from "../game/celestialBodies";
import { createRef } from "react";
import { CelestialMerge } from "./CelestialMerge";
import { CelestialMergeView } from "./CelestialMergeView";

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

  test("drops at the release position instead of the press position", () => {
    // Arrange
    const onDropXChange = vi.fn();
    const onDrop = vi.fn();
    const { container } = render(
      <CelestialMergeView
        canvasRef={createRef<HTMLCanvasElement>()}
        displayedScore={0}
        nextDropLevel={CelestialLevel.Moon}
        isGameOver={false}
        onDropXChange={onDropXChange}
        onDrop={onDrop}
        onReset={vi.fn()}
      />,
    );
    const canvas = container.querySelector("canvas");
    if (!canvas) throw new Error("Expected the game canvas to be rendered");

    // Act
    fireEvent.pointerMove(canvas, { clientX: 30 });

    // Assert
    expect(onDropXChange).toHaveBeenCalledExactlyOnceWith(30);
    expect(onDrop).not.toHaveBeenCalled();

    // Act
    fireEvent.pointerUp(canvas, { clientX: 40 });

    // Assert
    expect(onDropXChange).toHaveBeenCalledTimes(2);
    expect(onDropXChange).toHaveBeenLastCalledWith(40);
    expect(onDrop).toHaveBeenCalledExactlyOnceWith();
  });
});
