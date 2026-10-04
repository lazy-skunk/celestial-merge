import { BOARD_HEIGHT, BOARD_WIDTH } from "../board";
import { celestialBodyRadius, type CelestialLevel } from "../celestialBodies";
import type { CelestialBody } from "../gameRules";
import { canMergeCelestialBodies, mergeCelestialBodies } from "../gameRules";

const GRAVITY = 500;
const COLLISION_SOLVER_ITERATIONS = 16;
const CONTACT_TOLERANCE = 0.001;

type SimulationUpdateResult = {
  bodies: CelestialBody[];
  nextId: number;
  mergedLevels: CelestialLevel[];
  scoreGained: number;
};

type MergeState = {
  mergedBodyIds: Set<number>;
  createdBodies: CelestialBody[];
  nextId: number;
  mergedLevels: CelestialLevel[];
  scoreGained: number;
};

type BodyPairGeometry = {
  dx: number;
  dy: number;
  distance: number;
  minimumDistance: number;
  positionsAreIdentical: boolean;
};

type CollisionNormal = {
  nx: number;
  ny: number;
};

export function updateSimulation(
  bodies: CelestialBody[],
  nextId: number,
  dt: number,
): SimulationUpdateResult {
  const updatedBodies = bodies.map((body) => ({ ...body }));
  const previousXById = new Map(updatedBodies.map((body) => [body.id, body.x]));
  moveBodies(updatedBodies, dt);

  const result = resolveCollisions(updatedBodies, nextId);
  updateBodyRotations(result.bodies, previousXById);
  return result;
}

// Merge once per update, then resolve positions including newly created bodies.
// New bodies can merge on the next update when still touching.
function resolveCollisions(bodies: CelestialBody[], nextId: number): SimulationUpdateResult {
  const merges: MergeState = {
    mergedBodyIds: new Set<number>(),
    createdBodies: [],
    nextId,
    mergedLevels: [],
    scoreGained: 0,
  };

  resolveBodyPairs(bodies, merges);

  const resolvedBodies = merges.mergedBodyIds.size
    ? bodies.filter((body) => !merges.mergedBodyIds.has(body.id)).concat(merges.createdBodies)
    : bodies;

  settleBodyPositions(resolvedBodies);

  return {
    bodies: resolvedBodies,
    nextId: merges.nextId,
    mergedLevels: merges.mergedLevels,
    scoreGained: merges.scoreGained,
  };
}

function resolveBodyPairs(bodies: CelestialBody[], merges: MergeState) {
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const firstBody = bodies[i];
      const secondBody = bodies[j];
      if (merges.mergedBodyIds.has(firstBody.id) || merges.mergedBodyIds.has(secondBody.id)) {
        continue;
      }

      const geometry = measureBodyPair(firstBody, secondBody);
      if (geometry.distance > geometry.minimumDistance + CONTACT_TOLERANCE) continue;

      if (!canMergeCelestialBodies(firstBody, secondBody)) {
        if (geometry.distance < geometry.minimumDistance) {
          separateBodies(firstBody, secondBody, geometry);
        }
        continue;
      }

      const mergeResult = mergeCelestialBodies(merges.nextId, firstBody, secondBody);
      if (!mergeResult) continue;

      merges.mergedBodyIds.add(firstBody.id);
      merges.mergedBodyIds.add(secondBody.id);
      if (mergeResult.body) {
        merges.createdBodies.push(mergeResult.body);
        merges.nextId++;
      }
      merges.mergedLevels.push(mergeResult.mergedLevel);
      merges.scoreGained += mergeResult.scoreGained;
    }
  }
}

function settleBodyPositions(bodies: CelestialBody[]) {
  for (const body of bodies) constrainToBoard(body);

  for (let iteration = 0; iteration < COLLISION_SOLVER_ITERATIONS; iteration++) {
    let maximumOverlap = 0;
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const geometry = measureBodyPair(bodies[i], bodies[j]);
        const overlap = geometry.minimumDistance - geometry.distance;
        maximumOverlap = Math.max(maximumOverlap, overlap);
        if (overlap <= 0) continue;
        // Repeated corrections change positions only, so velocity changes happen once per contact.
        separatePositions(bodies[i], bodies[j], geometry, measureCollisionNormal(geometry));
      }
    }
    for (const body of bodies) constrainToBoard(body);
    if (maximumOverlap <= CONTACT_TOLERANCE) break;
  }
}

function measureBodyPair(firstBody: CelestialBody, secondBody: CelestialBody): BodyPairGeometry {
  const dx = secondBody.x - firstBody.x;
  const dy = secondBody.y - firstBody.y;
  const distance = Math.hypot(dx, dy);
  return {
    dx,
    dy,
    distance,
    minimumDistance: celestialBodyRadius(firstBody.level) + celestialBodyRadius(secondBody.level),
    positionsAreIdentical: distance === 0,
  };
}

function moveBodies(bodies: CelestialBody[], dt: number) {
  for (const body of bodies) {
    body.vy += GRAVITY * dt;
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    constrainToBoard(body);
  }
}

function updateBodyRotations(bodies: CelestialBody[], previousXById: ReadonlyMap<number, number>) {
  for (const body of bodies) {
    const previousX = previousXById.get(body.id);
    if (previousX === undefined) continue;
    body.rotation += (body.x - previousX) / celestialBodyRadius(body.level);
  }
}

function constrainToBoard(body: CelestialBody) {
  const radius = celestialBodyRadius(body.level);
  if (body.x < radius) {
    body.x = radius;
    if (body.vx < 0) body.vx = 0;
  } else if (body.x > BOARD_WIDTH - radius) {
    body.x = BOARD_WIDTH - radius;
    if (body.vx > 0) body.vx = 0;
  }
  if (body.y > BOARD_HEIGHT - radius) {
    body.y = BOARD_HEIGHT - radius;
    if (body.vy > 0) {
      body.vy = 0;
    }
  }
}

function separateBodies(
  firstBody: CelestialBody,
  secondBody: CelestialBody,
  geometry: BodyPairGeometry,
) {
  const normal = measureCollisionNormal(geometry);
  separatePositions(firstBody, secondBody, geometry, normal);
  matchCollisionVelocity(firstBody, secondBody, normal);
}

function measureCollisionNormal({ dx, dy, distance, positionsAreIdentical }: BodyPairGeometry) {
  return {
    nx: positionsAreIdentical ? 1 : dx / distance,
    ny: positionsAreIdentical ? 0 : dy / distance,
  };
}

function separatePositions(
  firstBody: CelestialBody,
  secondBody: CelestialBody,
  { distance, minimumDistance }: BodyPairGeometry,
  { nx, ny }: CollisionNormal,
) {
  const overlap = minimumDistance - distance;
  firstBody.x -= (nx * overlap) / 2;
  firstBody.y -= (ny * overlap) / 2;
  secondBody.x += (nx * overlap) / 2;
  secondBody.y += (ny * overlap) / 2;
}

function matchCollisionVelocity(
  firstBody: CelestialBody,
  secondBody: CelestialBody,
  { nx, ny }: CollisionNormal,
) {
  const relativeSpeed = (secondBody.vx - firstBody.vx) * nx + (secondBody.vy - firstBody.vy) * ny;
  if (relativeSpeed >= 0) return;

  const impulse = -relativeSpeed / 2;
  firstBody.vx -= impulse * nx;
  firstBody.vy -= impulse * ny;
  secondBody.vx += impulse * nx;
  secondBody.vy += impulse * ny;
}
