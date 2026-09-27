import { describe, expect, test } from "vite-plus/test";
import { BOARD_WIDTH, SPAWN_Y } from "./board";
import { celestialBodyRadius, CelestialLevel } from "./celestialBodies";
import {
  canMergeCelestialBodies,
  clampDropPosition,
  createCelestialBody,
  GAME_OVER_GRACE_SECONDS,
  mergeCelestialBodies,
  mergeScore,
  nextLevelAfterMerge,
  randomDropLevel,
  updateDangerLineExposure,
} from "./gameRules";

describe("game rules", () => {
  test("drop position stays inside the board", () => {
    expect(clampDropPosition(-20, CelestialLevel.Moon)).toBe(
      celestialBodyRadius(CelestialLevel.Moon),
    );
    expect(clampDropPosition(999, CelestialLevel.Mercury)).toBe(
      BOARD_WIDTH - celestialBodyRadius(CelestialLevel.Mercury),
    );
  });

  test("creates a celestial body at the clamped position", () => {
    expect(createCelestialBody(7, CelestialLevel.Moon, -1)).toMatchObject({
      id: 7,
      level: CelestialLevel.Moon,
      x: celestialBodyRadius(CelestialLevel.Moon),
      y: SPAWN_Y,
    });
  });

  test("drop level only uses the five smallest celestial bodies", () => {
    expect(randomDropLevel(() => 0)).toBe(CelestialLevel.Moon);
    expect(randomDropLevel(() => 0.999)).toBe(CelestialLevel.Mars);
  });

  test("merge awards the next celestial body score", () => {
    expect(mergeScore(CelestialLevel.Moon)).toBe(2);
  });

  test("only matching celestial body levels can merge", () => {
    expect(
      canMergeCelestialBodies(
        createCelestialBody(1, CelestialLevel.Moon, 100),
        createCelestialBody(2, CelestialLevel.Moon, 120),
      ),
    ).toBe(true);
    expect(
      canMergeCelestialBodies(
        createCelestialBody(1, CelestialLevel.Moon, 100),
        createCelestialBody(2, CelestialLevel.Mercury, 120),
      ),
    ).toBe(false);
  });

  test("creates a merge result for two matching celestial bodies", () => {
    const mergeResult = mergeCelestialBodies(
      3,
      createCelestialBody(1, CelestialLevel.Moon, 100),
      createCelestialBody(2, CelestialLevel.Moon, 120),
    );

    expect(mergeResult?.body).toMatchObject({
      id: 3,
      level: CelestialLevel.Mercury,
      x: 110,
    });
    expect(mergeResult?.scoreGained).toBe(mergeScore(CelestialLevel.Moon));
  });

  test("does not merge different celestial body levels", () => {
    expect(
      mergeCelestialBodies(
        3,
        createCelestialBody(1, CelestialLevel.Moon, 100),
        createCelestialBody(2, CelestialLevel.Mercury, 120),
      ),
    ).toBeNull();
  });

  test("tracks danger line exposure for bodies above the danger line", () => {
    const body = createCelestialBody(1, CelestialLevel.Moon, 100);
    body.y = 50;
    body.dangerLineExposureFor = GAME_OVER_GRACE_SECONDS - 0.01;

    expect(updateDangerLineExposure(body, 0.02)).toBe(true);
    expect(body.dangerLineExposureFor).toBeGreaterThan(GAME_OVER_GRACE_SECONDS);
  });

  test("clears danger line exposure below the danger area", () => {
    const body = createCelestialBody(1, CelestialLevel.Moon, 100);
    body.y = 200;
    body.dangerLineExposureFor = 1;

    expect(updateDangerLineExposure(body, 0)).toBe(false);
    expect(body.dangerLineExposureFor).toBe(0);
  });

  test("the progression reaches 2048 before the final bodies disappear", () => {
    expect(nextLevelAfterMerge(CelestialLevel.Pluto)).toBe(CelestialLevel.Sun);
    expect(nextLevelAfterMerge(CelestialLevel.Sun)).toBe(CelestialLevel.Galaxy);
    expect(mergeScore(CelestialLevel.Sun)).toBe(2048);
    expect(nextLevelAfterMerge(CelestialLevel.Galaxy)).toBeNull();
  });
});
