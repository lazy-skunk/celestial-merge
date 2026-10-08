import { describe, expect, test } from "vite-plus/test";
import { BOARD_WIDTH, DANGER_LINE } from "./board";
import { celestialBodyRadius, CelestialLevel } from "./celestialBodies";
import {
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
    expect(mergeResult?.mergedLevel).toBe(CelestialLevel.Moon);
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
    body.dangerLineProtectionFor = 0;

    // Act
    const isGameOver = updateDangerLineExposure(body, dangerExposureStepSeconds);

    // Assert
    expect(isGameOver).toBe(true);
    expect(body.dangerLineExposureFor).toBeGreaterThan(GAME_OVER_GRACE_SECONDS);
  });

  test("does not track danger line exposure for a freshly dropped body", () => {
    // Arrange
    const bodyOneId = 1;
    const bodyOneX = 100;
    const elapsedSeconds = 0.02;
    const body = createCelestialBody(bodyOneId, CelestialLevel.Moon, bodyOneX);

    // Act
    const isGameOver = updateDangerLineExposure(body, elapsedSeconds);

    // Assert
    expect(isGameOver).toBe(false);
    expect(body.dangerLineExposureFor).toBe(0);
    expect(body.dangerLineProtectionFor).toBeGreaterThan(0);
  });

  test("tracks danger line exposure after drop protection expires", () => {
    // Arrange
    const bodyOneId = 1;
    const bodyOneX = 100;
    const dangerExposureStepSeconds = 0.02;
    const body = createCelestialBody(bodyOneId, CelestialLevel.Moon, bodyOneX);
    body.dangerLineProtectionFor = 0;

    // Act
    const isGameOver = updateDangerLineExposure(body, dangerExposureStepSeconds);

    // Assert
    expect(isGameOver).toBe(false);
    expect(body.dangerLineExposureFor).toBe(dangerExposureStepSeconds);
  });

  test("does not track danger line exposure until the whole body is above the line", () => {
    // Arrange
    const bodyOneId = 1;
    const bodyOneX = 100;
    const elapsedSeconds = 0.02;
    const body = createCelestialBody(bodyOneId, CelestialLevel.Moon, bodyOneX);
    const radius = celestialBodyRadius(body.level);
    body.y = DANGER_LINE - radius / 2;
    body.dangerLineProtectionFor = 0;

    // Act
    const isGameOver = updateDangerLineExposure(body, elapsedSeconds);

    // Assert
    expect(isGameOver).toBe(false);
    expect(body.dangerLineExposureFor).toBe(0);
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
    const finalMergeScore = 2048;
    const levelBeforeFinal = CelestialLevel.Pluto;
    const finalLevel = CelestialLevel.Sun;

    // Act
    const nextLevelBeforeFinal = nextLevelAfterMerge(CelestialLevel.Neptune);
    const nextFinalLevel = nextLevelAfterMerge(levelBeforeFinal);
    const finalScore = mergeScore(finalLevel);
    const afterFinalLevel = nextLevelAfterMerge(finalLevel);

    // Assert
    expect(nextLevelBeforeFinal).toBe(levelBeforeFinal);
    expect(nextFinalLevel).toBe(finalLevel);
    expect(finalScore).toBe(finalMergeScore);
    expect(afterFinalLevel).toBeNull();
  });
});
