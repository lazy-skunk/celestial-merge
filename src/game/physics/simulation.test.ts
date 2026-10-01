import { describe, expect, test } from "vite-plus/test";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../board";
import { CelestialLevel, celestialBodyRadius } from "../celestialBodies";
import type { CelestialBody } from "../gameRules";
import { mergeScore } from "../gameRules";
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

function expectNoOverlap(bodies: CelestialBody[]) {
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const distance = Math.hypot(bodies[i].x - bodies[j].x, bodies[i].y - bodies[j].y);
      const minimumDistance =
        celestialBodyRadius(bodies[i].level) + celestialBodyRadius(bodies[j].level);
      expect(distance).toBeGreaterThanOrEqual(minimumDistance - 0.01);
    }
  }
}

describe("simulation", () => {
  test("moves a body downward under gravity", () => {
    // Arrange
    const defaultBodyY = 200;
    const noVelocity = 0;
    const nextIdAfterSingleBody = 2;
    const physicsStepSeconds = 0.1;
    const celestialBody = createTestBody();

    // Act
    const result = updateSimulation([celestialBody], nextIdAfterSingleBody, physicsStepSeconds);

    // Assert
    expect(result.bodies[0].y).toBeGreaterThan(defaultBodyY);
    expect(result.bodies[0].vy).toBeGreaterThan(noVelocity);
  });

  test("merges two matching bodies and awards score", () => {
    // Arrange
    const bodyTwoId = 2;
    const bodyThreeId = 3;
    const bodyFourId = 4;
    const nextIdAfterPair = 3;
    const overlappedBodyX = 110;
    const noElapsedSeconds = 0;
    const bodies = [createTestBody(), createTestBody({ id: bodyTwoId, x: overlappedBodyX })];

    // Act
    const physicsResult = updateSimulation(bodies, nextIdAfterPair, noElapsedSeconds);

    // Assert
    expect(physicsResult.bodies).toHaveLength(1);
    expect(physicsResult.bodies[0]).toMatchObject({
      id: bodyThreeId,
      level: CelestialLevel.Mercury,
    });
    expect(physicsResult.nextId).toBe(bodyFourId);
    expect(physicsResult.mergedLevels).toEqual([CelestialLevel.Moon]);
    expect(physicsResult.scoreGained).toBe(mergeScore(CelestialLevel.Moon));
  });

  test.each([3, 4])("consumes each body only once when %s matching bodies overlap", (count) => {
    // Arrange
    const firstBodyId = 1;
    const bodyPairSize = 2;
    const bodyThreeId = 3;
    const noElapsedSeconds = 0;
    const bodies = Array.from({ length: count }, (_, index) =>
      createTestBody({ id: index + firstBodyId }),
    );

    // Act
    const result = updateSimulation(bodies, count + firstBodyId, noElapsedSeconds);

    // Assert
    const mergeCount = Math.floor(count / bodyPairSize);
    expect(result.bodies).toHaveLength(count - mergeCount);
    expect(result.bodies.filter((body) => body.level === CelestialLevel.Mercury)).toHaveLength(
      mergeCount,
    );
    expect(result.bodies.filter((body) => body.level === CelestialLevel.Moon)).toEqual(
      count === bodyThreeId ? [expect.objectContaining({ id: bodyThreeId })] : [],
    );
    expectNoOverlap(result.bodies);
    expect(new Set(result.bodies.map((body) => body.id)).size).toBe(result.bodies.length);
    expect(result.nextId).toBe(count + firstBodyId + mergeCount);
    expect(result.mergedLevels).toEqual(
      Array.from({ length: mergeCount }, () => CelestialLevel.Moon),
    );
    expect(result.scoreGained).toBe(mergeCount * mergeScore(CelestialLevel.Moon));
  });

  test("waits until the next update to merge a newly created body", () => {
    // Arrange
    const defaultBodyId = 1;
    const bodyTwoId = 2;
    const bodyThreeId = 3;
    const bodyFourId = 4;
    const bodyFiveId = 5;
    const bodySixId = 6;
    const nextIdAfterTriple = 4;
    const noElapsedSeconds = 0;
    const bodies = [
      createTestBody({ id: defaultBodyId }),
      createTestBody({ id: bodyTwoId }),
      createTestBody({ id: bodyThreeId, level: CelestialLevel.Mercury }),
    ];

    // Act
    const first = updateSimulation(bodies, nextIdAfterTriple, noElapsedSeconds);
    const second = updateSimulation(first.bodies, first.nextId, noElapsedSeconds);

    // Assert
    expect(first.bodies).toHaveLength(2);
    expect(first.bodies).toEqual([
      expect.objectContaining({
        id: bodyThreeId,
        level: CelestialLevel.Mercury,
      }),
      expect.objectContaining({
        id: bodyFourId,
        level: CelestialLevel.Mercury,
      }),
    ]);
    expectNoOverlap(first.bodies);
    expect(first.nextId).toBe(bodyFiveId);
    expect(first.mergedLevels).toEqual([CelestialLevel.Moon]);
    expect(first.scoreGained).toBe(mergeScore(CelestialLevel.Moon));
    expect(second.bodies).toHaveLength(1);
    expect(second.bodies[0]).toMatchObject({ id: bodyFiveId, level: CelestialLevel.Venus });
    expect(second.nextId).toBe(bodySixId);
    expect(second.mergedLevels).toEqual([CelestialLevel.Mercury]);
    expect(second.scoreGained).toBe(mergeScore(CelestialLevel.Mercury));
  });

  test("removes two final bodies without creating another level", () => {
    // Arrange
    const bodyTwoId = 2;
    const nextIdAfterPair = 3;
    const overlappedBodyX = 110;
    const noElapsedSeconds = 0;
    const finalLevel = CelestialLevel.Sun;
    const bodies = [
      createTestBody({ level: finalLevel }),
      createTestBody({ id: bodyTwoId, level: finalLevel, x: overlappedBodyX }),
    ];

    // Act
    const physicsResult = updateSimulation(bodies, nextIdAfterPair, noElapsedSeconds);

    // Assert
    expect(physicsResult.bodies).toHaveLength(0);
    expect(physicsResult.nextId).toBe(nextIdAfterPair);
    expect(physicsResult.mergedLevels).toEqual([finalLevel]);
    expect(physicsResult.scoreGained).toBe(mergeScore(finalLevel));
  });

  test("preserves danger line exposure when bodies merge", () => {
    // Arrange
    const bodyTwoId = 2;
    const nextIdAfterPair = 3;
    const overlappedBodyX = 110;
    const noElapsedSeconds = 0;
    const dangerExposureLongerSeconds = 4;
    const dangerExposureShorterSeconds = 2;
    const bodies = [
      createTestBody({ dangerLineExposureFor: dangerExposureLongerSeconds }),
      createTestBody({
        id: bodyTwoId,
        x: overlappedBodyX,
        dangerLineExposureFor: dangerExposureShorterSeconds,
      }),
    ];

    // Act
    const result = updateSimulation(bodies, nextIdAfterPair, noElapsedSeconds);

    // Assert
    expect(result.bodies[0].dangerLineExposureFor).toBe(dangerExposureLongerSeconds);
  });

  test("stops a body moving into the wall and floor", () => {
    // Arrange
    const nextIdAfterSingleBody = 2;
    const noElapsedSeconds = 0;
    const noVelocity = 0;
    const wallCollisionX = 5;
    const floorCollisionY = 555;
    const leftwardSpeed = -100;
    const downwardSpeed = 100;
    const celestialBody = createTestBody({
      x: wallCollisionX,
      y: floorCollisionY,
      vx: leftwardSpeed,
      vy: downwardSpeed,
    });

    // Act
    const result = updateSimulation([celestialBody], nextIdAfterSingleBody, noElapsedSeconds);

    // Assert
    expect(result.bodies[0].vx).toBe(noVelocity);
    expect(result.bodies[0].vy).toBe(noVelocity);
  });

  test("keeps horizontal movement on the floor", () => {
    // Arrange
    const nextIdAfterSingleBody = 2;
    const noElapsedSeconds = 0;
    const floorCollisionY = 555;
    const rightwardSpeed = 100;
    const downwardSpeed = 100;
    const celestialBody = createTestBody({
      y: floorCollisionY,
      vx: rightwardSpeed,
      vy: downwardSpeed,
    });

    // Act
    const result = updateSimulation([celestialBody], nextIdAfterSingleBody, noElapsedSeconds);

    // Assert
    expect(result.bodies[0].vx).toBe(rightwardSpeed);
  });

  test("separates different overlapping bodies without merging them", () => {
    // Arrange
    const defaultBodyX = 100;
    const bodyTwoId = 2;
    const nextIdAfterPair = 3;
    const slightlyOverlappedBodyX = 105;
    const noElapsedSeconds = 0;
    const noScoreGained = 0;
    const bodies = [
      createTestBody(),
      createTestBody({
        id: bodyTwoId,
        level: CelestialLevel.Mercury,
        x: slightlyOverlappedBodyX,
      }),
    ];

    // Act
    const physicsResult = updateSimulation(bodies, nextIdAfterPair, noElapsedSeconds);

    // Assert
    expect(physicsResult.bodies).toHaveLength(2);
    expect(physicsResult.mergedLevels).toEqual([]);
    expect(physicsResult.scoreGained).toBe(noScoreGained);
    expect(physicsResult.bodies[0].x).not.toBe(defaultBodyX);
  });

  test("does not slow sliding between different overlapping bodies", () => {
    // Arrange
    const bodyTwoId = 2;
    const nextIdAfterPair = 3;
    const noElapsedSeconds = 0;
    const noVelocity = 0;
    const slightlyOverlappedBodyX = 105;
    const downwardSpeed = 100;
    const bodies = [
      createTestBody({ vy: noVelocity }),
      createTestBody({
        id: bodyTwoId,
        level: CelestialLevel.Mercury,
        x: slightlyOverlappedBodyX,
        vy: downwardSpeed,
      }),
    ];

    // Act
    const physicsResult = updateSimulation(bodies, nextIdAfterPair, noElapsedSeconds);

    // Assert
    expect(physicsResult.bodies[1].vy - physicsResult.bodies[0].vy).toBe(downwardSpeed);
  });

  test("does not mutate its input", () => {
    // Arrange
    const nextIdAfterSingleBody = 2;
    const physicsStepSeconds = 0.1;
    const celestialBody = createTestBody();

    // Act
    updateSimulation([celestialBody], nextIdAfterSingleBody, physicsStepSeconds);

    // Assert
    expect(celestialBody).toEqual(createTestBody());
  });

  test("separates different bodies at exactly the same position", () => {
    // Arrange
    const bodyTwoId = 2;
    const nextIdAfterPair = 3;
    const noElapsedSeconds = 0;
    const bodies = [
      createTestBody(),
      createTestBody({ id: bodyTwoId, level: CelestialLevel.Mercury }),
    ];

    // Act
    const physicsResult = updateSimulation(bodies, nextIdAfterPair, noElapsedSeconds);

    // Assert
    expect(physicsResult.bodies[0].x).not.toBe(physicsResult.bodies[1].x);
  });
});

describe("simulation board boundaries", () => {
  test.each([
    [12, 200, 18, 200],
    [348, 200, 342, 200],
    [100, 548, 100, 542],
  ])("keeps separated bodies inside walls and floor (%s, %s)", (x1, y1, x2, y2) => {
    // Arrange
    const bodyTwoId = 2;
    const nextIdAfterPair = 3;
    const noElapsedSeconds = 0;
    const bodies = [
      createTestBody({ x: x1, y: y1 }),
      createTestBody({ id: bodyTwoId, level: CelestialLevel.Mercury, x: x2, y: y2 }),
    ];

    // Act
    const result = updateSimulation(bodies, nextIdAfterPair, noElapsedSeconds);

    // Assert
    for (const body of result.bodies) {
      const radius = celestialBodyRadius(body.level);
      expect(body.x).toBeGreaterThanOrEqual(radius);
      expect(body.x).toBeLessThanOrEqual(BOARD_WIDTH - radius);
      expect(body.y).toBeLessThanOrEqual(BOARD_HEIGHT - radius);
    }
    expectNoOverlap(result.bodies);
  });

  test("keeps a stack separated over repeated gravity updates", () => {
    const levels = [CelestialLevel.Jupiter, CelestialLevel.Earth, CelestialLevel.Mercury];
    let top = BOARD_HEIGHT;
    let bodies = levels.map((level, index) => {
      const radius = celestialBodyRadius(level);
      const body = createTestBody({ id: index + 1, level, x: BOARD_WIDTH / 2, y: top - radius });
      top -= radius * 2;
      return body;
    });
    for (let frame = 0; frame < 180; frame++) {
      bodies = updateSimulation(bodies, 4, 1 / 60).bodies;
      expect(bodies).toHaveLength(3);
      expectNoOverlap(bodies);
      for (const body of bodies) {
        expect(body.y + celestialBodyRadius(body.level)).toBeLessThanOrEqual(BOARD_HEIGHT);
      }
    }
  });

  test.each([12, BOARD_WIDTH - 12])("constrains a newly merged body at x=%s", (x) => {
    // Arrange
    const bodyTwoId = 2;
    const nextIdAfterPair = 3;
    const noElapsedSeconds = 0;
    const floorMoonY = BOARD_HEIGHT - 12;
    const bodies = [
      createTestBody({ x, y: floorMoonY }),
      createTestBody({ id: bodyTwoId, x, y: floorMoonY }),
    ];

    // Act
    const result = updateSimulation(bodies, nextIdAfterPair, noElapsedSeconds);

    // Assert
    expect(result.bodies).toHaveLength(1);
    const body = result.bodies[0];
    const radius = celestialBodyRadius(body.level);
    expect(body.x).toBe(x < BOARD_WIDTH / 2 ? radius : BOARD_WIDTH - radius);
    expect(body.y).toBe(BOARD_HEIGHT - radius);
  });
});
