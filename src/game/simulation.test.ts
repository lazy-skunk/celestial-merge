import { describe, expect, test } from "vite-plus/test";
import { BOARD_HEIGHT, BOARD_WIDTH } from "./board";
import { CelestialLevel, celestialBodyRadius } from "./celestialBodies";
import type { CelestialBody } from "./gameRules";
import { mergeScore } from "./gameRules";
import { updateSimulation } from "./simulation";

function createTestBody(overrides: Partial<CelestialBody> = {}): CelestialBody {
  return {
    id: 1,
    level: CelestialLevel.Moon,
    x: 100,
    y: 200,
    vx: 0,
    vy: 0,
    dangerLineExposureFor: 0,
    ...overrides,
  };
}

describe("simulation", () => {
  test("moves a body downward under gravity", () => {
    const celestialBody = createTestBody();

    const result = updateSimulation([celestialBody], 2, 0.1);

    expect(result.bodies[0].y).toBeGreaterThan(200);
    expect(result.bodies[0].vy).toBeGreaterThan(0);
  });

  test("merges two matching bodies and awards score", () => {
    const physicsResult = updateSimulation(
      [createTestBody(), createTestBody({ id: 2, x: 110 })],
      3,
      0,
    );

    expect(physicsResult.bodies).toHaveLength(1);
    expect(physicsResult.bodies[0]).toMatchObject({ id: 3, level: CelestialLevel.Mercury });
    expect(physicsResult.nextId).toBe(4);
    expect(physicsResult.scoreGained).toBe(mergeScore(CelestialLevel.Moon));
  });

  test.each([3, 4])("consumes each body only once when %s matching bodies overlap", (count) => {
    const bodies = Array.from({ length: count }, (_, index) => createTestBody({ id: index + 1 }));

    const result = updateSimulation(bodies, count + 1, 0);

    const mergeCount = Math.floor(count / 2);
    expect(result.bodies).toHaveLength(count - mergeCount);
    expect(result.bodies.filter((body) => body.level === CelestialLevel.Mercury)).toHaveLength(
      mergeCount,
    );
    expect(result.bodies.filter((body) => body.level === CelestialLevel.Moon)).toEqual(
      count === 3 ? [bodies[2]] : [],
    );
    expect(new Set(result.bodies.map((body) => body.id)).size).toBe(result.bodies.length);
    expect(result.nextId).toBe(count + 1 + mergeCount);
    expect(result.scoreGained).toBe(mergeCount * mergeScore(CelestialLevel.Moon));
  });

  test("waits until the next update to merge a newly created body", () => {
    const first = updateSimulation(
      [
        createTestBody({ id: 1 }),
        createTestBody({ id: 2 }),
        createTestBody({ id: 3, level: CelestialLevel.Mercury }),
      ],
      4,
      0,
    );

    expect(first.bodies).toHaveLength(2);
    expect(first.bodies).toEqual([
      expect.objectContaining({ id: 3, level: CelestialLevel.Mercury, x: 100, y: 200 }),
      expect.objectContaining({ id: 4, level: CelestialLevel.Mercury, x: 100, y: 200 }),
    ]);
    expect(first.nextId).toBe(5);
    expect(first.scoreGained).toBe(mergeScore(CelestialLevel.Moon));

    const second = updateSimulation(first.bodies, first.nextId, 0);

    expect(second.bodies).toHaveLength(1);
    expect(second.bodies[0]).toMatchObject({ id: 5, level: CelestialLevel.Venus });
    expect(second.nextId).toBe(6);
    expect(second.scoreGained).toBe(mergeScore(CelestialLevel.Mercury));
  });

  test("removes two final bodies without creating another level", () => {
    const finalLevel = CelestialLevel.Galaxy;
    const physicsResult = updateSimulation(
      [createTestBody({ level: finalLevel }), createTestBody({ id: 2, level: finalLevel, x: 110 })],
      3,
      0,
    );

    expect(physicsResult.bodies).toHaveLength(0);
    expect(physicsResult.nextId).toBe(3);
    expect(physicsResult.scoreGained).toBe(mergeScore(finalLevel));
  });

  test("preserves danger line exposure when bodies merge", () => {
    const result = updateSimulation(
      [
        createTestBody({ dangerLineExposureFor: 4 }),
        createTestBody({ id: 2, x: 110, dangerLineExposureFor: 2 }),
      ],
      3,
      0,
    );
    expect(result.bodies[0].dangerLineExposureFor).toBe(4);
  });

  test("bounces a body away from the wall and floor", () => {
    const celestialBody = createTestBody({
      x: 5,
      y: 555,
      vx: -100,
      vy: 100,
    });

    const result = updateSimulation([celestialBody], 2, 0);

    expect(result.bodies[0].vx).toBeGreaterThan(0);
    expect(result.bodies[0].vy).toBeLessThan(0);
  });

  test("slows horizontal movement on the floor", () => {
    const celestialBody = createTestBody({
      y: 555,
      vx: 100,
      vy: 100,
    });

    const result = updateSimulation([celestialBody], 2, 0);

    expect(result.bodies[0].vx).toBeLessThan(100);
  });

  test("separates different overlapping bodies without merging them", () => {
    const physicsResult = updateSimulation(
      [createTestBody(), createTestBody({ id: 2, level: CelestialLevel.Mercury, x: 105 })],
      3,
      0,
    );

    expect(physicsResult.bodies).toHaveLength(2);
    expect(physicsResult.scoreGained).toBe(0);
    expect(physicsResult.bodies[0].x).not.toBe(100);
  });

  test("slightly reduces sliding speed between different overlapping bodies", () => {
    const physicsResult = updateSimulation(
      [
        createTestBody({ vy: 0 }),
        createTestBody({ id: 2, level: CelestialLevel.Mercury, x: 105, vy: 100 }),
      ],
      3,
      0,
    );

    expect(physicsResult.bodies[1].vy - physicsResult.bodies[0].vy).toBeLessThan(100);
  });

  test("does not mutate its input", () => {
    const celestialBody = createTestBody();

    updateSimulation([celestialBody], 2, 0.1);

    expect(celestialBody).toEqual(createTestBody());
  });

  test("separates different bodies at exactly the same position", () => {
    const physicsResult = updateSimulation(
      [createTestBody(), createTestBody({ id: 2, level: CelestialLevel.Mercury })],
      3,
      0,
    );

    expect(physicsResult.bodies[0].x).not.toBe(physicsResult.bodies[1].x);
  });
});

describe("simulation board boundaries", () => {
  test.each([
    [12, 200, 18, 200],
    [348, 200, 342, 200],
    [100, 548, 100, 542],
  ])("keeps separated bodies inside walls and floor (%s, %s)", (x1, y1, x2, y2) => {
    const result = updateSimulation(
      [
        createTestBody({ x: x1, y: y1 }),
        createTestBody({ id: 2, level: CelestialLevel.Mercury, x: x2, y: y2 }),
      ],
      3,
      0,
    );
    for (const body of result.bodies) {
      const radius = celestialBodyRadius(body.level);
      expect(body.x).toBeGreaterThanOrEqual(radius);
      expect(body.x).toBeLessThanOrEqual(BOARD_WIDTH - radius);
      expect(body.y).toBeLessThanOrEqual(BOARD_HEIGHT - radius);
    }
  });

  test.each([12, BOARD_WIDTH - 12])("constrains a newly merged body at x=%s", (x) => {
    const result = updateSimulation(
      [
        createTestBody({ x, y: BOARD_HEIGHT - 12 }),
        createTestBody({ id: 2, x, y: BOARD_HEIGHT - 12 }),
      ],
      3,
      0,
    );
    expect(result.bodies).toHaveLength(1);
    const body = result.bodies[0];
    const radius = celestialBodyRadius(body.level);
    expect(body.x).toBe(x < BOARD_WIDTH / 2 ? radius : BOARD_WIDTH - radius);
    expect(body.y).toBe(BOARD_HEIGHT - radius);
  });
});
