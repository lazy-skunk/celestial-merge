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
    // Arrange
    const offBoardLeftX = -20;
    const offBoardRightX = 999;
    const leftRadius = celestialBodyRadius(CelestialLevel.Moon);
    const rightRadius = celestialBodyRadius(CelestialLevel.Mercury);

    // Act
    const clampedLeft = clampDropPosition(offBoardLeftX, CelestialLevel.Moon);
    const clampedRight = clampDropPosition(offBoardRightX, CelestialLevel.Mercury);

    // Assert
    expect(clampedLeft).toBe(leftRadius);
    expect(clampedRight).toBe(BOARD_WIDTH - rightRadius);
  });

  test("creates a celestial body at the clamped position", () => {
    // Arrange
    const createdBodyId = 7;
    const offBoardCreateX = -1;
    const expectedX = celestialBodyRadius(CelestialLevel.Moon);

    // Act
    const body = createCelestialBody(createdBodyId, CelestialLevel.Moon, offBoardCreateX);

    // Assert
    expect(body).toMatchObject({
      id: createdBodyId,
      level: CelestialLevel.Moon,
      x: expectedX,
      y: SPAWN_Y,
    });
  });

  test("drop level only uses the five smallest celestial bodies", () => {
    // Arrange
    const minRandomValue = 0;
    const maxCandidateRandomValue = 0.999;
    const minRandom = () => minRandomValue;
    const maxCandidateRandom = () => maxCandidateRandomValue;

    // Act
    const firstCandidateLevel = randomDropLevel(minRandom);
    const lastCandidateLevel = randomDropLevel(maxCandidateRandom);

    // Assert
    expect(firstCandidateLevel).toBe(CelestialLevel.Moon);
    expect(lastCandidateLevel).toBe(CelestialLevel.Mars);
  });

  test("merge awards the next celestial body score", () => {
    // Arrange
    const moonMergeScore = 2;
    const level = CelestialLevel.Moon;

    // Act
    const score = mergeScore(level);

    // Assert
    expect(score).toBe(moonMergeScore);
  });

  test("only matching celestial body levels can merge", () => {
    // Arrange
    const bodyOneId = 1;
    const bodyTwoId = 2;
    const bodyOneX = 100;
    const bodyTwoX = 120;
    const moon = createCelestialBody(bodyOneId, CelestialLevel.Moon, bodyOneX);
    const matchingMoon = createCelestialBody(bodyTwoId, CelestialLevel.Moon, bodyTwoX);
    const mercury = createCelestialBody(bodyTwoId, CelestialLevel.Mercury, bodyTwoX);

    // Act
    const canMergeMatchingBodies = canMergeCelestialBodies(moon, matchingMoon);
    const canMergeDifferentBodies = canMergeCelestialBodies(moon, mercury);

    // Assert
    expect(canMergeMatchingBodies).toBe(true);
    expect(canMergeDifferentBodies).toBe(false);
  });

  test("creates a merge result for two matching celestial bodies", () => {
    // Arrange
    const bodyOneId = 1;
    const bodyTwoId = 2;
    const mergedBodyId = 3;
    const bodyOneX = 100;
    const bodyTwoX = 120;
    const mergedBodyX = 110;
    const firstBody = createCelestialBody(bodyOneId, CelestialLevel.Moon, bodyOneX);
    const secondBody = createCelestialBody(bodyTwoId, CelestialLevel.Moon, bodyTwoX);

    // Act
    const mergeResult = mergeCelestialBodies(mergedBodyId, firstBody, secondBody);

    // Assert
    expect(mergeResult?.body).toMatchObject({
      id: mergedBodyId,
      level: CelestialLevel.Mercury,
      x: mergedBodyX,
    });
    expect(mergeResult?.scoreGained).toBe(mergeScore(CelestialLevel.Moon));
  });

  test("does not merge different celestial body levels", () => {
    // Arrange
    const bodyOneId = 1;
    const bodyTwoId = 2;
    const mergedBodyId = 3;
    const bodyOneX = 100;
    const bodyTwoX = 120;
    const moon = createCelestialBody(bodyOneId, CelestialLevel.Moon, bodyOneX);
    const mercury = createCelestialBody(bodyTwoId, CelestialLevel.Mercury, bodyTwoX);

    // Act
    const mergeResult = mergeCelestialBodies(mergedBodyId, moon, mercury);

    // Assert
    expect(mergeResult).toBeNull();
  });

  test("tracks danger line exposure for bodies above the danger line", () => {
    // Arrange
    const bodyOneId = 1;
    const bodyOneX = 100;
    const aboveDangerLineY = 50;
    const dangerExposureStepSeconds = 0.02;
    const dangerExposureRemainingSeconds = 0.01;
    const body = createCelestialBody(bodyOneId, CelestialLevel.Moon, bodyOneX);
    body.y = aboveDangerLineY;
    body.dangerLineExposureFor = GAME_OVER_GRACE_SECONDS - dangerExposureRemainingSeconds;

    // Act
    const isGameOver = updateDangerLineExposure(body, dangerExposureStepSeconds);

    // Assert
    expect(isGameOver).toBe(true);
    expect(body.dangerLineExposureFor).toBeGreaterThan(GAME_OVER_GRACE_SECONDS);
  });

  test("clears danger line exposure below the danger area", () => {
    // Arrange
    const bodyOneId = 1;
    const bodyOneX = 100;
    const belowDangerAreaY = 200;
    const existingDangerExposureSeconds = 1;
    const noElapsedSeconds = 0;
    const body = createCelestialBody(bodyOneId, CelestialLevel.Moon, bodyOneX);
    body.y = belowDangerAreaY;
    body.dangerLineExposureFor = existingDangerExposureSeconds;

    // Act
    const isGameOver = updateDangerLineExposure(body, noElapsedSeconds);

    // Assert
    expect(isGameOver).toBe(false);
    expect(body.dangerLineExposureFor).toBe(0);
  });

  test("the progression reaches 2048 before the final bodies disappear", () => {
    // Arrange
    const sunMergeScore = 2048;
    const penultimateLevel = CelestialLevel.Sun;
    const finalLevel = CelestialLevel.Galaxy;

    // Act
    const levelBeforePenultimate = nextLevelAfterMerge(CelestialLevel.Pluto);
    const levelBeforeFinal = nextLevelAfterMerge(penultimateLevel);
    const penultimateScore = mergeScore(penultimateLevel);
    const afterFinalLevel = nextLevelAfterMerge(finalLevel);

    // Assert
    expect(levelBeforePenultimate).toBe(penultimateLevel);
    expect(levelBeforeFinal).toBe(finalLevel);
    expect(penultimateScore).toBe(sunMergeScore);
    expect(afterFinalLevel).toBeNull();
  });
});
