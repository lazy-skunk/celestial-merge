import colors from "tailwindcss/colors";
import { BOARD_HEIGHT, BOARD_WIDTH, DANGER_LINE, SPAWN_Y } from "./game/board";
import { CELESTIAL_BODIES, CelestialLevel, celestialBodyRadius } from "./game/celestialBodies";

type DrawableBody = Readonly<{
  level: CelestialLevel;
  x: number;
  y: number;
  rotation?: number;
  dangerLineExposureFor?: number;
}>;

const FULL_CIRCLE = Math.PI * 2;
const GUIDE_DASH_LENGTH = 5;
const DANGER_LINE_BLINK_INTERVAL_MS = 400;
const DANGER_LINE_DIM_OPACITY = 0.35;
const DROP_GUIDE_OPACITY = 0.3;
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
  const isDanger = board.bodies.some(isBodyExposedToDangerLine);
  const shouldDimDangerLine =
    isDanger && Math.floor(performance.now() / DANGER_LINE_BLINK_INTERVAL_MS) % 2 === 0;

  ctx.save();
  ctx.globalAlpha = shouldDimDangerLine ? DANGER_LINE_DIM_OPACITY : 1;
  ctx.setLineDash([GUIDE_DASH_LENGTH, GUIDE_DASH_LENGTH]);
  ctx.strokeStyle = colors.rose[700];
  ctx.lineWidth = isDanger ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(0, DANGER_LINE);
  ctx.lineTo(BOARD_WIDTH, DANGER_LINE);
  ctx.stroke();
  ctx.restore();
  ctx.setLineDash([]);

  if (!board.gameOver) {
    drawDropGuide(ctx, board);
  }
  for (const body of board.bodies) drawCelestialBody(ctx, body);
  if (board.gameOver) return;

  const previewOpacity = board.canDrop ? PREVIEW_OPACITY : COOLDOWN_PREVIEW_OPACITY;
  drawCelestialBody(ctx, { level: board.dropLevel, x: board.dropX, y: SPAWN_Y }, previewOpacity);
}

function isBodyExposedToDangerLine(body: DrawableBody) {
  return (
    (body.dangerLineExposureFor ?? 0) > 0 && body.y + celestialBodyRadius(body.level) < DANGER_LINE
  );
}

function drawDropGuide(ctx: CanvasRenderingContext2D, board: BoardDrawingState) {
  const radius = celestialBodyRadius(board.dropLevel);

  ctx.save();
  ctx.globalAlpha = board.canDrop ? DROP_GUIDE_OPACITY : DROP_GUIDE_OPACITY / 2;
  ctx.setLineDash([GUIDE_DASH_LENGTH, GUIDE_DASH_LENGTH]);
  ctx.strokeStyle = colors.slate[200];
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(board.dropX, SPAWN_Y + radius);
  ctx.lineTo(board.dropX, BOARD_HEIGHT);
  ctx.stroke();
  ctx.restore();
  ctx.setLineDash([]);
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
    ctx.translate(x, y);
    ctx.rotate(body.rotation ?? 0);
    ctx.drawImage(
      image,
      -cx * scale,
      -cy * scale,
      image.naturalWidth * scale,
      image.naturalHeight * scale,
    );
  } else {
    // Keep bodies visible while their image is loading or if it fails to load.
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, FULL_CIRCLE);
    ctx.fillStyle = colors.slate[500];
    ctx.fill();
  }
  ctx.restore();
}
