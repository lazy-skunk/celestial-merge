import colors from "tailwindcss/colors";
import { BOARD_HEIGHT, BOARD_WIDTH, DANGER_LINE, SPAWN_Y } from "./board";
import { CELESTIAL_BODIES, CelestialLevel, celestialBodyRadius } from "./celestialBodies";

type DrawableBody = Readonly<{ level: CelestialLevel; x: number; y: number }>;

const FULL_CIRCLE = Math.PI * 2;
const SUN_RAY_COUNT = 12;
const STRIPE_START = -0.5;
const STRIPE_END = 0.5;
const STRIPE_GAP = 0.3;
const GUIDE_DASH_LENGTH = 8;
const PREVIEW_OPACITY = 0.75;
const COOLDOWN_PREVIEW_OPACITY = 0.25;

type BoardDrawingState = {
  bodies: readonly DrawableBody[];
  dropX: number;
  dropLevel: CelestialLevel;
  gameOver: boolean;
  canDrop: boolean;
};

export function drawBoard(ctx: CanvasRenderingContext2D, board: BoardDrawingState) {
  ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  ctx.setLineDash([GUIDE_DASH_LENGTH, GUIDE_DASH_LENGTH]);
  ctx.strokeStyle = colors.rose[700];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, DANGER_LINE);
  ctx.lineTo(BOARD_WIDTH, DANGER_LINE);
  ctx.stroke();
  ctx.setLineDash([]);

  for (const body of board.bodies) drawCelestialBody(ctx, body);
  if (board.gameOver) return;

  const previewOpacity = board.canDrop ? PREVIEW_OPACITY : COOLDOWN_PREVIEW_OPACITY;
  drawCelestialBody(ctx, { level: board.dropLevel, x: board.dropX, y: SPAWN_Y }, previewOpacity);
}

export function drawCelestialBody(ctx: CanvasRenderingContext2D, body: DrawableBody, alpha = 1) {
  const celestialBodyDefinition = CELESTIAL_BODIES[body.level];
  const { x, y } = body;
  const radius = celestialBodyRadius(body.level);

  ctx.save();
  ctx.globalAlpha = alpha;
  if (body.level === CelestialLevel.Sun) {
    drawSunRays(ctx, x, y, radius);
  }
  if (body.level === CelestialLevel.Saturn) {
    drawSaturnRing(ctx, x, y, radius, "back");
  }
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, FULL_CIRCLE);
  ctx.fillStyle = celestialBodyDefinition.color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = colors.slate[300];
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius - 1, 0, FULL_CIRCLE);
  ctx.clip();
  drawCelestialSurface(ctx, body.level, x, y, radius);
  ctx.restore();

  if (body.level === CelestialLevel.Saturn) {
    drawSaturnRing(ctx, x, y, radius, "front");
  }
  ctx.restore();
}

function drawSunRays(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = colors.amber[400];
  ctx.lineWidth = Math.max(2, radius * 0.05);
  for (let i = 0; i < SUN_RAY_COUNT; i++) {
    ctx.rotate(FULL_CIRCLE / SUN_RAY_COUNT);
    ctx.beginPath();
    ctx.moveTo(0, -radius * 1.05);
    ctx.lineTo(0, -radius * 1.15);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCelestialSurface(
  ctx: CanvasRenderingContext2D,
  level: CelestialLevel,
  x: number,
  y: number,
  radius: number,
) {
  if (level === CelestialLevel.Moon || level === CelestialLevel.Mercury) {
    drawCraters(ctx, x, y, radius);
  }
  if (level === CelestialLevel.Venus) {
    drawCloudBands(ctx, x, y, radius);
  }
  if (level === CelestialLevel.Earth) {
    drawEarthLand(ctx, x, y, radius);
  }
  if (level === CelestialLevel.Mars) {
    drawMarsTerrain(ctx, x, y, radius);
  }
  if (level === CelestialLevel.Jupiter) {
    drawJupiterBands(ctx, x, y, radius);
  }
  if (level === CelestialLevel.Uranus) {
    drawUranusBand(ctx, x, y, radius);
  }
  if (level === CelestialLevel.Neptune) {
    drawNeptuneStorm(ctx, x, y, radius);
  }
  if (level === CelestialLevel.Pluto) {
    drawPlutoPatch(ctx, x, y, radius);
  }
  if (level === CelestialLevel.Galaxy) {
    drawGalaxySpiral(ctx, x, y, radius);
  }
}

function drawCraters(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.fillStyle = colors.slate[700];
  drawFilledEllipse(ctx, x - radius * 0.3, y - radius * 0.1, radius * 0.15, radius * 0.1, -0.2);
  drawFilledEllipse(ctx, x + radius * 0.2, y + radius * 0.18, radius * 0.1, radius * 0.08, 0.3);
  drawFilledEllipse(ctx, x + radius * 0.1, y - radius * 0.3, radius * 0.08, radius * 0.06, 0);
}

function drawCloudBands(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.strokeStyle = colors.amber[300];
  ctx.lineWidth = Math.max(2, radius * 0.1);
  for (let offset = -0.3; offset <= 0.3; offset += 0.3) {
    ctx.beginPath();
    ctx.ellipse(x, y + radius * offset, radius * 0.85, radius * 0.12, -0.2, 0, Math.PI);
    ctx.stroke();
  }
}

function drawEarthLand(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(radius, radius);
  ctx.fillStyle = colors.green[700];

  // Hokkaido
  ctx.beginPath();
  ctx.moveTo(0.32, -0.78);
  ctx.lineTo(0.48, -0.61);
  ctx.lineTo(0.68, -0.52);
  ctx.lineTo(0.49, -0.39);
  ctx.lineTo(0.32, -0.45);
  ctx.lineTo(0.22, -0.32);
  ctx.lineTo(0.12, -0.42);
  ctx.lineTo(0.25, -0.56);
  ctx.closePath();
  ctx.fill();

  // Honshu
  ctx.beginPath();
  ctx.moveTo(0.22, -0.25);
  ctx.bezierCurveTo(0.37, -0.2, 0.35, 0.02, 0.2, 0.12);
  ctx.lineTo(0.24, 0.23);
  ctx.lineTo(0.1, 0.2);
  ctx.lineTo(-0.03, 0.31);
  ctx.lineTo(-0.12, 0.39);
  ctx.lineTo(-0.22, 0.28);
  ctx.lineTo(-0.49, 0.35);
  ctx.lineTo(-0.55, 0.25);
  ctx.bezierCurveTo(-0.38, 0.13, -0.22, 0.17, -0.1, 0.07);
  ctx.lineTo(-0.05, -0.08);
  ctx.lineTo(0.04, -0.02);
  ctx.bezierCurveTo(0.17, -0.07, 0.15, -0.18, 0.22, -0.25);
  ctx.closePath();
  ctx.fill();

  // Sado
  ctx.beginPath();
  ctx.moveTo(-0.08, -0.33);
  ctx.lineTo(-0.04, -0.27);
  ctx.lineTo(-0.09, -0.22);
  ctx.lineTo(-0.1, -0.16);
  ctx.lineTo(-0.16, -0.18);
  ctx.lineTo(-0.13, -0.25);
  ctx.closePath();
  ctx.fill();

  // Shikoku
  ctx.beginPath();
  ctx.moveTo(-0.4, 0.44);
  ctx.lineTo(-0.2, 0.41);
  ctx.lineTo(-0.17, 0.49);
  ctx.lineTo(-0.34, 0.57);
  ctx.lineTo(-0.44, 0.51);
  ctx.closePath();
  ctx.fill();

  // Kyushu
  ctx.beginPath();
  ctx.moveTo(-0.63, 0.36);
  ctx.lineTo(-0.51, 0.43);
  ctx.lineTo(-0.49, 0.56);
  ctx.lineTo(-0.62, 0.75);
  ctx.lineTo(-0.69, 0.61);
  ctx.lineTo(-0.79, 0.54);
  ctx.lineTo(-0.7, 0.46);
  ctx.lineTo(-0.76, 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawMarsTerrain(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.fillStyle = colors.red[900];
  drawFilledEllipse(ctx, x - radius * 0.3, y - radius * 0.05, radius * 0.2, radius * 0.1, 0.2);
  drawFilledEllipse(ctx, x + radius * 0.25, y + radius * 0.25, radius * 0.18, radius * 0.08, -0.25);
}

function drawJupiterBands(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.lineWidth = Math.max(2, radius * 0.12);
  ctx.strokeStyle = colors.orange[400];
  for (let offset = STRIPE_START; offset <= STRIPE_END; offset += STRIPE_GAP) {
    ctx.beginPath();
    ctx.moveTo(x - radius, y + radius * offset);
    ctx.lineTo(x + radius, y + radius * offset);
    ctx.stroke();
  }
  ctx.fillStyle = colors.red[500];
  drawFilledEllipse(ctx, x + radius * 0.35, y + radius * 0.15, radius * 0.15, radius * 0.1, -0.15);
}

function drawUranusBand(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.5);
  ctx.strokeStyle = colors.cyan[300];
  ctx.lineWidth = Math.max(2, radius * 0.12);
  ctx.beginPath();
  ctx.moveTo(-radius, 0);
  ctx.lineTo(radius, 0);
  ctx.stroke();
  ctx.restore();
}

function drawNeptuneStorm(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.fillStyle = colors.blue[950];
  drawFilledEllipse(ctx, x + radius * 0.25, y - radius * 0.1, radius * 0.18, radius * 0.1, -0.25);
  ctx.strokeStyle = colors.blue[400];
  ctx.lineWidth = Math.max(1.5, radius * 0.06);
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.15, y - radius * 0.5, radius * 0.35, radius * 0.08, -0.15, 0, Math.PI);
  ctx.stroke();
}

function drawPlutoPatch(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.fillStyle = colors.orange[200];
  drawFilledEllipse(ctx, x, y - radius * 0.1, radius * 0.25, radius * 0.15, 0.1);
}

function drawGalaxySpiral(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = colors.violet[200];
  ctx.lineWidth = Math.max(2, radius * 0.08);
  for (let arm = 0; arm < 2; arm++) {
    ctx.rotate(Math.PI);
    ctx.beginPath();
    for (let step = 0; step <= 24; step++) {
      const angle = step * 0.2;
      const distance = radius * 0.08 + radius * 0.03 * step;
      const pointX = Math.cos(angle) * distance;
      const pointY = Math.sin(angle) * distance * 0.6;
      if (step === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawSaturnRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  side: "back" | "front",
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.2);
  ctx.strokeStyle = colors.amber[500];
  ctx.lineWidth = Math.max(4, radius * 0.16);
  ctx.beginPath();
  const startAngle = side === "back" ? Math.PI : 0;
  ctx.ellipse(0, 0, radius * 1.4, radius * 0.4, 0, startAngle, startAngle + Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawFilledEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  rotation: number,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, FULL_CIRCLE);
  ctx.fill();
}
