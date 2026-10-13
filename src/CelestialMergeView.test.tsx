// @vitest-environment jsdom
import { fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { expect, test, vi } from "vite-plus/test";

import { CelestialMergeView } from "./CelestialMergeView";
import { CelestialLevel } from "./game/celestialBodies";

test("drops at the release position instead of the press position", () => {
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

  fireEvent.pointerDown(canvas, { clientX: 20 });

  expect(onDropXChange).toHaveBeenCalledExactlyOnceWith(20);
  expect(onDrop).not.toHaveBeenCalled();

  fireEvent.pointerMove(canvas, { clientX: 30 });

  expect(onDropXChange).toHaveBeenCalledTimes(2);
  expect(onDropXChange).toHaveBeenLastCalledWith(30);
  expect(onDrop).not.toHaveBeenCalled();

  fireEvent.pointerUp(canvas, { clientX: 40 });

  expect(onDropXChange).toHaveBeenCalledTimes(3);
  expect(onDropXChange).toHaveBeenLastCalledWith(40);
  expect(onDrop).toHaveBeenCalledExactlyOnceWith();
});
