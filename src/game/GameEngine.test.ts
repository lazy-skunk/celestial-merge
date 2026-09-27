import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { BOARD_WIDTH } from "./board";
import { celestialBodyRadius, CelestialLevel } from "./celestialBodies";
import { GameEngine } from "./GameEngine";
import { createCelestialBody, GAME_OVER_GRACE_SECONDS } from "./gameRules";
import * as simulation from "./simulation";

afterEach(() => vi.restoreAllMocks());

describe("GameEngine", () => {
  test("owns the complete initial game state", () => {
    const engine = new GameEngine(() => 0);

    expect(engine.snapshot()).toMatchObject({
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
    const engine = new GameEngine(() => 0);
    engine.setDropX(-100);

    expect(engine.drop()).toBe(true);
    expect(engine.snapshot().bodies[0]).toMatchObject({
      id: 1,
      level: CelestialLevel.Moon,
      x: celestialBodyRadius(CelestialLevel.Moon),
    });
  });

  test("promotes the next drop level after dropping", () => {
    const levels = [0, 0.2, 0.4];
    const engine = new GameEngine(() => levels.shift() ?? 0);

    expect(engine.snapshot()).toMatchObject({
      dropLevel: CelestialLevel.Moon,
      nextDropLevel: CelestialLevel.Mercury,
    });

    expect(engine.drop()).toBe(true);
    expect(engine.snapshot()).toMatchObject({
      dropLevel: CelestialLevel.Mercury,
      nextDropLevel: CelestialLevel.Venus,
    });
  });

  test("keeps internal bodies isolated from snapshots", () => {
    const engine = new GameEngine(() => 0);
    engine.drop();

    const snapshotBody = engine.snapshot().bodies[0];
    // @ts-expect-error Snapshot bodies are readonly; verify runtime isolation too.
    snapshotBody.x = 999;

    expect(engine.snapshot().bodies[0].x).toBe(BOARD_WIDTH / 2);
  });

  test("enforces cooldown using game time", () => {
    const engine = new GameEngine(() => 0);

    expect(engine.drop()).toBe(true);
    expect(engine.drop()).toBe(false);
    for (let i = 0; i < 32; i++) engine.advance(0.01);
    expect(engine.drop()).toBe(false);
    engine.advance(0.02);
    expect(engine.drop()).toBe(true);
  });

  test("reset restores state and clears an active cooldown", () => {
    const levels = [0, 0.99, 0.99, 0.99, 0];
    const engine = new GameEngine(() => levels.shift() ?? 0);
    engine.setDropX(10);
    engine.drop();

    engine.reset();

    expect(engine.snapshot()).toMatchObject({
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
    const bodies = [
      { ...createCelestialBody(1, CelestialLevel.Moon, 100), dangerLineExposureFor: 5 },
      { ...createCelestialBody(2, CelestialLevel.Mercury, 200), dangerLineExposureFor: 2 },
      { ...createCelestialBody(3, CelestialLevel.Venus, 250), y: 300, dangerLineExposureFor: 2 },
    ];
    const update = vi.spyOn(simulation, "updateSimulation").mockReturnValue({
      bodies,
      nextId: 4,
      scoreGained: 8,
    });
    const engine = new GameEngine(() => 0);

    engine.advance(0.02);

    const snapshot = engine.snapshot();
    expect(snapshot.score).toBe(8);
    expect(snapshot.isGameOver).toBe(true);
    expect(snapshot.canDrop).toBe(false);
    expect(snapshot.bodies[0].dangerLineExposureFor).toBeGreaterThan(5);
    expect(snapshot.bodies[1].dangerLineExposureFor).toBeGreaterThan(2);
    expect(snapshot.bodies[2].dangerLineExposureFor).toBe(0);
    expect(engine.drop()).toBe(false);
    engine.advance(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(engine.snapshot()).toEqual(snapshot);

    engine.reset();
    expect(engine.snapshot()).toMatchObject({ score: 0, isGameOver: false, canDrop: true });
  });

  test("allows bodies above the line until the grace period is exceeded", () => {
    vi.spyOn(simulation, "updateSimulation").mockReturnValue({
      bodies: [createCelestialBody(1, CelestialLevel.Moon, 100)],
      nextId: 2,
      scoreGained: 0,
    });
    const engine = new GameEngine(() => 0);
    for (let i = 0; i < GAME_OVER_GRACE_SECONDS * 100 - 1; i++) engine.advance(0.01);
    expect(engine.snapshot().isGameOver).toBe(false);
    engine.advance(0.03);
    expect(engine.snapshot().isGameOver).toBe(true);
  });
});

describe("GameEngine timing and drop bounds", () => {
  test("produces the same simulation for different frame intervals", () => {
    const fast = new GameEngine(() => 0);
    const slow = new GameEngine(() => 0);
    fast.drop();
    slow.drop();
    for (let i = 0; i < 120; i++) fast.advance(1 / 120);
    for (let i = 0; i < 30; i++) slow.advance(1 / 30);
    expect(slow.snapshot()).toEqual(fast.snapshot());
  });

  test("retains partial steps and clears them on reset", () => {
    const engine = new GameEngine(() => 0);
    engine.drop();
    const initial = engine.snapshot();
    engine.advance(1 / 240);
    expect(engine.snapshot()).toEqual(initial);
    engine.advance(1 / 240);
    expect(engine.snapshot().bodies[0].y).toBeGreaterThan(initial.bodies[0].y);

    engine.advance(1 / 240);
    engine.reset();
    engine.drop();
    const reset = engine.snapshot();
    engine.advance(1 / 240);
    expect(engine.snapshot()).toEqual(reset);
  });

  test("limits catch-up after a long pause and ignores invalid elapsed time", () => {
    const paused = new GameEngine(() => 0);
    const normal = new GameEngine(() => 0);
    paused.drop();
    normal.drop();
    paused.advance(60);
    normal.advance(0.05);
    expect(paused.snapshot()).toEqual(normal.snapshot());
    const snapshot = paused.snapshot();
    for (const elapsed of [-1, 0, NaN, Infinity]) paused.advance(elapsed);
    expect(paused.snapshot()).toEqual(snapshot);
    expect(paused.snapshot().canDrop).toBe(false);
  });

  test.each([0, BOARD_WIDTH])("keeps the next drop inside the board at x=%s", (x) => {
    const levels = [0, 0.8];
    const engine = new GameEngine(() => levels.shift() ?? 0);
    engine.setDropX(x);
    engine.drop();
    const snapshot = engine.snapshot();
    const radius = celestialBodyRadius(snapshot.dropLevel);
    expect(snapshot.dropX).toBe(x === 0 ? radius : BOARD_WIDTH - radius);
    for (let i = 0; i < 40; i++) engine.advance(0.01);
    engine.drop();
    expect(engine.snapshot().bodies.at(-1)?.x).toBe(snapshot.dropX);
  });
});
