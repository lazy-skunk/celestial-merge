import colors from "tailwindcss/colors";
import { BOARD_HEIGHT, BOARD_WIDTH, DANGER_LINE, SPAWN_Y } from "./board";
import { CELESTIAL_BODIES, CelestialLevel, celestialBodyRadius } from "./celestialBodies";

type DrawableBody = Readonly<{ level: CelestialLevel; x: number; y: number }>;

const FULL_CIRCLE = Math.PI * 2;
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

const bodyImages = new Map<string, HTMLImageElement>();

function getBodyImage(src: string) {
  let image = bodyImages.get(src);
  if (!image) {
    image = new Image();
    image.src = src;
    bodyImages.set(src, image);
  }
  return image;
}

export function drawCelestialBody(ctx: CanvasRenderingContext2D, body: DrawableBody, alpha = 1) {
  const definition = CELESTIAL_BODIES[body.level];
  const { x, y } = body;
  const radius = celestialBodyRadius(body.level);
  const image = definition.image ? getBodyImage(definition.image) : undefined;

  ctx.save();
  ctx.globalAlpha = alpha;
  if (image?.complete && image.naturalWidth > 0 && definition.imageBody) {
    // Align the spherical surface with the collision circle while preserving rings and glow.
    const { cx, cy, radius: imageRadius } = definition.imageBody;
    const scale = radius / imageRadius;
    ctx.drawImage(
      image,
      x - cx * scale,
      y - cy * scale,
      image.naturalWidth * scale,
      image.naturalHeight * scale,
    );
  } else {
    // Keep bodies visible while their image is loading or if it fails to load.
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, FULL_CIRCLE);
    ctx.fillStyle = colors.slate[500];
    ctx.fill();
    if (body.level === CelestialLevel.BlackHole) drawBlackHole(ctx, x, y, radius);
  }
  ctx.restore();
}

function drawBlackHole(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = colors.violet[950];
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, FULL_CIRCLE);
  ctx.fill();

  ctx.rotate(-0.25);
  ctx.strokeStyle = colors.sky[200];
  ctx.lineWidth = Math.max(3, radius * 0.18);
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.9, radius * 0.36, 0, 0, FULL_CIRCLE);
  ctx.stroke();

  ctx.strokeStyle = colors.blue[500];
  ctx.lineWidth = Math.max(2, radius * 0.08);
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.05, radius * 0.43, 0, 0, FULL_CIRCLE);
  ctx.stroke();

  ctx.fillStyle = colors.black;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.38, 0, FULL_CIRCLE);
  ctx.fill();

  ctx.strokeStyle = colors.slate[100];
  ctx.lineWidth = Math.max(1, radius * 0.04);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.42, 0, FULL_CIRCLE);
  ctx.stroke();
  ctx.restore();
}
