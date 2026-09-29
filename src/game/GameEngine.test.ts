import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { BOARD_WIDTH } from "./board";
import { celestialBodyRadius, CelestialLevel } from "./celestialBodies";
import { GameEngine } from "./GameEngine";
import { createCelestialBody, GAME_OVER_GRACE_SECONDS } from "./gameRules";
import * as simulation from "./simulation";

afterEach(() => vi.restoreAllMocks());

describe("GameEngine", () => {
  test("owns the complete initial game state", () => {
    // Arrange
    const minRandom = 0;
    const engine = new GameEngine(() => minRandom);

    // Act
    const snapshot = engine.snapshot();

    // Assert
    expect(snapshot).toMatchObject({
      bodies: [],
      dropX: BOARD_WIDTH / 2,
      dropLevel: CelestialLevel.Moon,
      nextDropLevel: CelestialLevel.Moon,
      score: 0,
      isGameOver: false,
      canDrop: true,
    });
  });

  test("clamps the position and creates a body from the drop level", () => {
    // Arrange
    const minRandom = 0;
    const offBoardLeftX = -100;
    const bodyOneId = 1;
    const engine = new GameEngine(() => minRandom);
    engine.setDropX(offBoardLeftX);

    // Act
    const didDrop = engine.drop();
    const [body] = engine.snapshot().bodies;

    // Assert
    expect(didDrop).toBe(true);
    expect(body).toMatchObject({
      id: bodyOneId,
      level: CelestialLevel.Moon,
      x: celestialBodyRadius(CelestialLevel.Moon),
    });
  });

  test("promotes the next drop level after dropping", () => {
    // Arrange
    const minRandom = 0;
    const mercuryRandom = 0.2;
    const venusRandom = 0.4;
    const levels = [minRandom, mercuryRandom, venusRandom];
    const engine = new GameEngine(() => levels.shift() ?? minRandom);
    const initialSnapshot = engine.snapshot();

    // Assert
    expect(initialSnapshot).toMatchObject({
      dropLevel: CelestialLevel.Moon,
      nextDropLevel: CelestialLevel.Mercury,
    });

    // Act
    const didDrop = engine.drop();
    const snapshot = engine.snapshot();

    // Assert
    expect(didDrop).toBe(true);
    expect(snapshot).toMatchObject({
      dropLevel: CelestialLevel.Mercury,
      nextDropLevel: CelestialLevel.Venus,
    });
  });

  test("keeps internal bodies isolated from snapshots", () => {
    // Arrange
    const minRandom = 0;
    const mutatedSnapshotX = 999;
    const engine = new GameEngine(() => minRandom);
    engine.drop();

    // Act
    const snapshotBody = engine.snapshot().bodies[0];
    // @ts-expect-error Snapshot bodies are readonly; verify runtime isolation too.
    snapshotBody.x = mutatedSnapshotX;
    const actualBodyX = engine.snapshot().bodies[0].x;

    // Assert
    expect(actualBodyX).toBe(BOARD_WIDTH / 2);
  });

  test("enforces cooldown using game time", () => {
    // Arrange
    const minRandom = 0;
    const dropCooldownStepSeconds = 0.01;
    const dropCooldownStepsBeforeReady = 32;
    const dropCooldownFinalStepSeconds = 0.02;
    const engine = new GameEngine(() => minRandom);

    // Act
    const firstDrop = engine.drop();
    const immediateDrop = engine.drop();
    for (let i = 0; i < dropCooldownStepsBeforeReady; i++) {
      engine.advance(dropCooldownStepSeconds);
    }
    const almostReadyDrop = engine.drop();
    engine.advance(dropCooldownFinalStepSeconds);
    const readyDrop = engine.drop();

    // Assert
    expect(firstDrop).toBe(true);
    expect(immediateDrop).toBe(false);
    expect(almostReadyDrop).toBe(false);
    expect(readyDrop).toBe(true);
  });

  test("reset restores state and clears an active cooldown", () => {
    // Arrange
    const minRandom = 0;
    const maxCandidateRandom = 0.99;
    const edgeDropX = 10;
    const levels = [
      minRandom,
      maxCandidateRandom,
      maxCandidateRandom,
      maxCandidateRandom,
      minRandom,
    ];
    const engine = new GameEngine(() => levels.shift() ?? minRandom);
    engine.setDropX(edgeDropX);
    engine.drop();

    // Act
    engine.reset();
    const snapshot = engine.snapshot();

    // Assert
    expect(snapshot).toMatchObject({
      bodies: [],
      dropX: BOARD_WIDTH / 2,
      dropLevel: CelestialLevel.Mars,
      nextDropLevel: CelestialLevel.Moon,
      score: 0,
      isGameOver: false,
      canDrop: true,
    });
  });

  test("applies score and checks every body's danger exposure after simulation", () => {
    // Arrange
    const minRandom = 0;
    const scoreGainedFromSimulation = 8;
    const advanceOneStepSeconds = 0.02;
    const bodyOneId = 1;
    const bodyTwoId = 2;
    const bodyThreeId = 3;
    const bodyFourId = 4;
    const bodyOneX = 100;
    const bodyTwoX = 200;
    const bodyThreeX = 250;
    const bodyBelowDangerY = 300;
    const expiredDangerExposureSeconds = 5;
    const existingDangerExposureSeconds = 2;
    const gameOverAdvanceSeconds = 1;
    const bodies = [
      {
        ...createCelestialBody(bodyOneId, CelestialLevel.Moon, bodyOneX),
        dangerLineExposureFor: expiredDangerExposureSeconds,
      },
      {
        ...createCelestialBody(bodyTwoId, CelestialLevel.Mercury, bodyTwoX),
        dangerLineExposureFor: existingDangerExposureSeconds,
      },
      {
        ...createCelestialBody(bodyThreeId, CelestialLevel.Venus, bodyThreeX),
        y: bodyBelowDangerY,
        dangerLineExposureFor: existingDangerExposureSeconds,
      },
    ];
    const update = vi.spyOn(simulation, "updateSimulation").mockReturnValue({
      bodies,
      nextId: bodyFourId,
      scoreGained: scoreGainedFromSimulation,
    });
    const engine = new GameEngine(() => minRandom);

    // Act
    engine.advance(advanceOneStepSeconds);
    const snapshot = engine.snapshot();
    const blockedDrop = engine.drop();
    engine.advance(gameOverAdvanceSeconds);

    // Assert
    expect(snapshot.score).toBe(scoreGainedFromSimulation);
    expect(snapshot.isGameOver).toBe(true);
    expect(snapshot.canDrop).toBe(false);
    expect(snapshot.bodies[0].dangerLineExposureFor).toBeGreaterThan(expiredDangerExposureSeconds);
    expect(snapshot.bodies[1].dangerLineExposureFor).toBeGreaterThan(existingDangerExposureSeconds);
    expect(snapshot.bodies[2].dangerLineExposureFor).toBe(0);
    expect(blockedDrop).toBe(false);
    expect(update).toHaveBeenCalledTimes(1);
    expect(engine.snapshot()).toEqual(snapshot);

    // Act
    engine.reset();
    const resetSnapshot = engine.snapshot();

    // Assert
    expect(resetSnapshot).toMatchObject({ score: 0, isGameOver: false, canDrop: true });
  });

  test("allows bodies above the line until the grace period is exceeded", () => {
    // Arrange
    const minRandom = 0;
    const noScoreGained = 0;
    const bodyOneId = 1;
    const bodyTwoId = 2;
    const bodyOneX = 100;
    const gracePeriodStepSeconds = 0.01;
    const gracePeriodStepsPerSecond = 100;
    const gracePeriodFinalStepSeconds = 0.03;
    vi.spyOn(simulation, "updateSimulation").mockReturnValue({
      bodies: [createCelestialBody(bodyOneId, CelestialLevel.Moon, bodyOneX)],
      nextId: bodyTwoId,
      scoreGained: noScoreGained,
    });
    const engine = new GameEngine(() => minRandom);

    // Act
    for (let i = 0; i < GAME_OVER_GRACE_SECONDS * gracePeriodStepsPerSecond - 1; i++) {
      engine.advance(gracePeriodStepSeconds);
    }
    const beforeGracePeriodExpires = engine.snapshot();
    engine.advance(gracePeriodFinalStepSeconds);
    const afterGracePeriodExpires = engine.snapshot();

    // Assert
    expect(beforeGracePeriodExpires.isGameOver).toBe(false);
    expect(afterGracePeriodExpires.isGameOver).toBe(true);
  });
});

describe("GameEngine timing and drop bounds", () => {
  test("produces the same simulation for different frame intervals", () => {
    // Arrange
    const minRandom = 0;
    const fastFrameCount = 120;
    const fastFrameSeconds = 1 / fastFrameCount;
    const slowFrameCount = 30;
    const slowFrameSeconds = 1 / slowFrameCount;
    const fast = new GameEngine(() => minRandom);
    const slow = new GameEngine(() => minRandom);
    fast.drop();
    slow.drop();

    // Act
    for (let i = 0; i < fastFrameCount; i++) fast.advance(fastFrameSeconds);
    for (let i = 0; i < slowFrameCount; i++) slow.advance(slowFrameSeconds);
    const fastSnapshot = fast.snapshot();
    const slowSnapshot = slow.snapshot();

    // Assert
    expect(slowSnapshot).toEqual(fastSnapshot);
  });

  test("retains partial steps and clears them on reset", () => {
    // Arrange
    const minRandom = 0;
    const halfStepSeconds = 1 / 240;
    const engine = new GameEngine(() => minRandom);
    engine.drop();
    const initial = engine.snapshot();

    // Act
    engine.advance(halfStepSeconds);
    const partialStepSnapshot = engine.snapshot();
    engine.advance(halfStepSeconds);
    const completeStepSnapshot = engine.snapshot();

    // Assert
    expect(partialStepSnapshot).toEqual(initial);
    expect(completeStepSnapshot.bodies[0].y).toBeGreaterThan(initial.bodies[0].y);

    // Act
    engine.advance(halfStepSeconds);
    engine.reset();
    engine.drop();
    const reset = engine.snapshot();
    engine.advance(halfStepSeconds);
    const postResetPartialStepSnapshot = engine.snapshot();

    // Assert
    expect(postResetPartialStepSnapshot).toEqual(reset);
  });

  test("limits catch-up after a long pause and ignores invalid elapsed time", () => {
    // Arrange
    const minRandom = 0;
    const longPauseSeconds = 60;
    const maxCatchUpSeconds = 0.05;
    const invalidElapsedSeconds = [-1, 0, NaN, Infinity];
    const paused = new GameEngine(() => minRandom);
    const normal = new GameEngine(() => minRandom);
    paused.drop();
    normal.drop();

    // Act
    paused.advance(longPauseSeconds);
    normal.advance(maxCatchUpSeconds);
    const pausedSnapshot = paused.snapshot();
    const normalSnapshot = normal.snapshot();

    // Assert
    expect(pausedSnapshot).toEqual(normalSnapshot);

    // Act
    const snapshot = paused.snapshot();
    for (const elapsed of invalidElapsedSeconds) paused.advance(elapsed);
    const afterInvalidElapsedSnapshot = paused.snapshot();

    // Assert
    expect(afterInvalidElapsedSnapshot).toEqual(snapshot);
    expect(afterInvalidElapsedSnapshot.canDrop).toBe(false);
  });

  test.each([0, BOARD_WIDTH])("keeps the next drop inside the board at x=%s", (x) => {
    // Arrange
    const minRandom = 0;
    const marsRandom = 0.8;
    const cooldownElapsedSteps = 120;
    const dropCooldownStepSeconds = 0.01;
    const levels = [minRandom, marsRandom];
    const engine = new GameEngine(() => levels.shift() ?? minRandom);
    engine.setDropX(x);

    // Act
    engine.drop();
    const snapshot = engine.snapshot();

    // Assert
    const radius = celestialBodyRadius(snapshot.dropLevel);
    expect(snapshot.dropX).toBe(x === 0 ? radius : BOARD_WIDTH - radius);

    // Act
    for (let i = 0; i < cooldownElapsedSteps; i++) {
      engine.advance(dropCooldownStepSeconds);
    }
    engine.drop();
    const finalBodyX = engine.snapshot().bodies.at(-1)?.x;

    // Assert
    expect(finalBodyX).toBe(snapshot.dropX);
  });
});
