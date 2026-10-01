import { afterEach, expect, test, vi } from "vite-plus/test";
import { CELESTIAL_BODIES, CelestialLevel, celestialBodyRadius } from "../celestialBodies";
import { drawCelestialBody } from "./draw";

afterEach(() => vi.unstubAllGlobals());

test.each([
  [CelestialLevel.Neptune, 418, 411],
  [CelestialLevel.Saturn, 732, 459],
  [CelestialLevel.Sun, 560, 542],
])("aligns the image surface with the collision circle for level %s", (level, width, height) => {
  vi.stubGlobal(
    "Image",
    class {
      complete = true;
      naturalWidth = width;
      naturalHeight = height;
      src = "";
    },
  );
  const drawImage = vi.fn();
  const clip = vi.fn();
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    clip,
    drawImage,
  } as unknown as CanvasRenderingContext2D;
  const x = 140;
  const y = 230;

  drawCelestialBody(ctx, { level, x, y });

  const circle = CELESTIAL_BODIES[level].imageBody!;
  const [, left, top, drawnWidth, drawnHeight] = drawImage.mock.calls[0];
  const scaleX = drawnWidth / width;
  const scaleY = drawnHeight / height;
  const radius = celestialBodyRadius(level);
  expect(left + circle.cx * scaleX).toBeCloseTo(x);
  expect(top + circle.cy * scaleY).toBeCloseTo(y);
  expect(circle.radius * scaleX).toBeCloseTo(radius);
  expect(circle.radius * scaleY).toBeCloseTo(radius);
  expect(clip).not.toHaveBeenCalled();
});
