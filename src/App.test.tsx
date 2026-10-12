// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { App } from "./App";

const gameAudio = vi.hoisted(() => ({
  playMerge: vi.fn(),
  startBgm: vi.fn(),
  stopBgm: vi.fn(),
  unlock: vi.fn(),
}));

vi.mock("./draw", () => ({
  drawBoard: vi.fn(),
  drawCelestialBody: vi.fn(),
}));
vi.mock("./audio/gameAudio", () => ({ createGameAudio: () => gameAudio }));

let cancelFrame: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
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

describe("App", () => {
  test("cancels the pending animation frame on unmount", () => {
    // Arrange
    const { unmount } = render(<App />);

    // Assert
    expect(cancelFrame).not.toHaveBeenCalled();

    // Act
    unmount();

    // Assert
    expect(cancelFrame).toHaveBeenCalledExactlyOnceWith(1);
  });

  test("stops BGM when the page moves to the background", () => {
    render(<App />);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");

    fireEvent(document, new Event("visibilitychange"));

    expect(gameAudio.stopBgm).toHaveBeenCalledExactlyOnceWith();
  });

  test("stops BGM when the page is hidden", () => {
    render(<App />);

    fireEvent(window, new Event("pagehide"));

    expect(gameAudio.stopBgm).toHaveBeenCalledExactlyOnceWith();
  });
});
