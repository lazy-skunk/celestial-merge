import { BOARD_WIDTH } from "./board";
import type { CelestialLevel } from "./celestialBodies";
import type { CelestialBody } from "./gameRules";
import {
  clampDropPosition,
  createCelestialBody,
  randomDropLevel,
  updateDangerLineExposure,
} from "./gameRules";
import { updateSimulation } from "./physics/simulation";

const TIME_STEP = 1 / 120;
const MAX_ELAPSED_SECONDS = 0.05;

const DROP_COOLDOWN_SECONDS = 0.33;

export type GameSnapshot = Readonly<{
  bodies: readonly Readonly<CelestialBody>[];
  dropX: number;
  dropLevel: CelestialLevel;
  nextDropLevel: CelestialLevel;
  score: number;
  isGameOver: boolean;
  canDrop: boolean;
}>;

export class GameEngine {
  private accumulatedTime = 0;
  private bodies: CelestialBody[] = [];
  private nextId = 1;
  private dropX = BOARD_WIDTH / 2;
  private dropLevel: CelestialLevel;
  private nextDropLevel: CelestialLevel;
  private score = 0;
  private isGameOver = false;
  private dropCooldownRemaining = 0;
  private readonly random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
    this.dropLevel = randomDropLevel(random);
    this.nextDropLevel = randomDropLevel(random);
  }

  reset() {
    this.accumulatedTime = 0;
    this.bodies = [];
    this.nextId = 1;
    this.dropX = BOARD_WIDTH / 2;
    this.dropLevel = randomDropLevel(this.random);
    this.nextDropLevel = randomDropLevel(this.random);
    this.score = 0;
    this.isGameOver = false;
    this.dropCooldownRemaining = 0;
  }

  setDropX(x: number) {
    this.dropX = clampDropPosition(x, this.dropLevel);
  }

  drop() {
    if (this.dropCooldownRemaining > 0 || this.isGameOver) return false;

    this.bodies = [...this.bodies, createCelestialBody(this.nextId++, this.dropLevel, this.dropX)];
    this.dropCooldownRemaining = DROP_COOLDOWN_SECONDS;
    this.dropLevel = this.nextDropLevel;
    this.dropX = clampDropPosition(this.dropX, this.dropLevel);
    this.nextDropLevel = randomDropLevel(this.random);
    return true;
  }

  /** Advances by elapsed wall time in seconds, capped to avoid catch-up after a pause. */
  advance(elapsedSeconds: number) {
    if (this.isGameOver || !Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return;

    this.accumulatedTime += Math.min(elapsedSeconds, MAX_ELAPSED_SECONDS);
    while (this.accumulatedTime >= TIME_STEP && !this.isGameOver) {
      this.accumulatedTime -= TIME_STEP;
      this.step();
    }
  }

  private step() {
    const dt = TIME_STEP;
    this.dropCooldownRemaining = Math.max(0, this.dropCooldownRemaining - dt);
    const result = updateSimulation(this.bodies, this.nextId, dt);
    this.bodies = result.bodies;
    this.nextId = result.nextId;
    this.score += result.scoreGained;
    for (const body of this.bodies) {
      const isDangerous = updateDangerLineExposure(body, dt);
      this.isGameOver = this.isGameOver || isDangerous;
    }
  }

  snapshot(): GameSnapshot {
    return {
      bodies: this.bodies.map((body) => ({ ...body })),
      dropX: this.dropX,
      dropLevel: this.dropLevel,
      nextDropLevel: this.nextDropLevel,
      score: this.score,
      isGameOver: this.isGameOver,
      canDrop: this.dropCooldownRemaining === 0 && !this.isGameOver,
    };
  }
}
