import { BOARD_WIDTH, DANGER_LINE, SPAWN_Y } from "./board";
import { CelestialLevel, celestialBodyRadius } from "./celestialBodies";

export const GAME_OVER_GRACE_SECONDS = 5;
export const DROP_DANGER_LINE_PROTECTION_SECONDS = 1;
const DROP_CANDIDATE_LEVEL_COUNT = 5;

export type CelestialBody = {
  id: number;
  level: CelestialLevel;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  dangerLineExposureFor: number;
  dangerLineProtectionFor: number;
};

export type CelestialMergeResult = {
  body: CelestialBody | null;
  mergedLevel: CelestialLevel;
  scoreGained: number;
};

export function clampDropPosition(x: number, level: CelestialLevel) {
  const radius = celestialBodyRadius(level);
  return Math.max(radius, Math.min(BOARD_WIDTH - radius, x));
}

export function createCelestialBody(id: number, level: CelestialLevel, x: number): CelestialBody {
  return {
    id,
    level,
    x: clampDropPosition(x, level),
    y: SPAWN_Y,
    vx: 0,
    vy: 0,
    rotation: 0,
    dangerLineExposureFor: 0,
    dangerLineProtectionFor: DROP_DANGER_LINE_PROTECTION_SECONDS,
  };
}

export function randomDropLevel(random = Math.random): CelestialLevel {
  return Math.floor(random() * DROP_CANDIDATE_LEVEL_COUNT) as CelestialLevel;
}

export function mergeCelestialBodies(
  id: number,
  firstBody: CelestialBody,
  secondBody: CelestialBody,
): CelestialMergeResult | null {
  if (!canMergeCelestialBodies(firstBody, secondBody)) return null;

  const level = nextLevelAfterMerge(firstBody.level);
  const body =
    level === null
      ? null
      : {
          id,
          level,
          x: (firstBody.x + secondBody.x) / 2,
          y: (firstBody.y + secondBody.y) / 2,
          vx: (firstBody.vx + secondBody.vx) / 2,
          vy: (firstBody.vy + secondBody.vy) / 2,
          rotation: (firstBody.rotation + secondBody.rotation) / 2,
          dangerLineExposureFor: Math.max(
            firstBody.dangerLineExposureFor,
            secondBody.dangerLineExposureFor,
          ),
          dangerLineProtectionFor: Math.min(
            firstBody.dangerLineProtectionFor,
            secondBody.dangerLineProtectionFor,
          ),
        };

  return {
    body,
    mergedLevel: firstBody.level,
    scoreGained: mergeScore(firstBody.level),
  };
}

export function canMergeCelestialBodies(firstBody: CelestialBody, secondBody: CelestialBody) {
  return firstBody.level === secondBody.level;
}

export function updateDangerLineExposure(body: CelestialBody, dt: number) {
  const radius = celestialBodyRadius(body.level);
  const isAboveDangerLine = body.y + radius < DANGER_LINE;

  body.dangerLineProtectionFor = Math.max(0, body.dangerLineProtectionFor - dt);

  if (body.dangerLineProtectionFor === 0 && isAboveDangerLine) {
    body.dangerLineExposureFor += dt;
  } else {
    body.dangerLineExposureFor = 0;
  }

  return body.dangerLineExposureFor > GAME_OVER_GRACE_SECONDS;
}

export function mergeScore(level: CelestialLevel) {
  return 2 ** (level + 1);
}

export function nextLevelAfterMerge(level: CelestialLevel): CelestialLevel | null {
  return level < CelestialLevel.Sun ? ((level + 1) as CelestialLevel) : null;
}
