import {
  CELESTIAL_BODIES,
  CELESTIAL_PROGRESSION,
  CelestialLevel,
  celestialBodyRadius,
} from "../game/celestialBodies";
import { drawCelestialBody } from "../game/draw";
import { useEffect, useRef, type RefObject } from "react";

const NEXT_BODY_PREVIEW_SIZE = 36;

type CelestialMergeViewProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  displayedScore: number;
  nextDropLevel: CelestialLevel;
  isGameOver: boolean;
  onDropXChange: (clientX: number) => void;
  onDrop: () => void;
  onReset: () => void;
};

export function CelestialMergeView({
  canvasRef,
  displayedScore,
  nextDropLevel,
  isGameOver,
  onDropXChange,
  onDrop,
  onReset,
}: CelestialMergeViewProps) {
  const helpTextLines = [
    "クリックまたはタップして天体を落とします。",
    "危険ライン上に一定時間残ると終了します。",
  ];

  return (
    <main
      className="grid min-h-screen place-items-center bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: `url(${import.meta.env.BASE_URL}bg_moon_getsumen.jpg)` }}
    >
      <section className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-4">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-200">天体マージ</h1>
          <div className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1 text-right">
            <span className="block text-xs text-slate-400">得点</span>
            <strong>{displayedScore}</strong>
          </div>
        </header>

        <div className="flex h-12 items-center gap-2 text-xs text-slate-300">
          <span>次の天体</span>
          <CelestialBodyPreview level={nextDropLevel} />
          <strong className="text-sm text-slate-100">{CELESTIAL_BODIES[nextDropLevel].name}</strong>
          <p className="ml-auto">同じ天体をくっつけよう</p>
        </div>

        <div className="relative overflow-hidden rounded-lg border-2 border-slate-600 bg-slate-950">
          <canvas
            ref={canvasRef}
            className="block w-full touch-none"
            onPointerMove={(event) => onDropXChange(event.clientX)}
            onPointerDown={(event) => {
              onDropXChange(event.clientX);
              onDrop();
            }}
          />
          {isGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/70">
              <p>ゲームオーバー</p>
              <strong className="text-3xl">{displayedScore} 点</strong>
              <button className="rounded bg-slate-300 px-3 py-2 text-slate-950" onClick={onReset}>
                もう一度遊ぶ
              </button>
            </div>
          )}
        </div>

        <div className="pt-2 text-xs text-slate-300">
          <span className="mb-1 block text-slate-400">進化順</span>
          <CelestialProgressionRow levels={CELESTIAL_PROGRESSION} />
        </div>

        <footer className="flex items-center justify-between gap-3 pt-3 text-xs text-slate-400">
          <span>
            {helpTextLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
          <button
            className="shrink-0 rounded border border-slate-600 px-3 py-2 text-slate-200"
            onClick={onReset}
          >
            リセット
          </button>
        </footer>
      </section>
    </main>
  );
}

function CelestialProgressionRow({ levels }: { levels: CelestialLevel[] }) {
  return (
    <div className="flex items-start justify-between gap-0.5">
      {levels.map((level, index) => (
        <div key={level} className="flex min-w-0 items-start gap-0.5">
          {index > 0 && <span className="pt-1 text-[10px] text-slate-500">→</span>}
          <div className="grid w-5 justify-items-center gap-0.5">
            <CelestialBodyPreview level={level} size={20} />
            <span className="text-center text-[8px] leading-none">
              {CELESTIAL_BODIES[level].name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CelestialBodyPreview({
  level,
  size = NEXT_BODY_PREVIEW_SIZE,
}: {
  level: CelestialLevel;
  size?: number;
}) {
  const definition = CELESTIAL_BODIES[level];
  if (definition.image) {
    return (
      <img
        src={definition.image}
        alt={definition.name}
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return <DrawnCelestialBodyPreview level={level} size={size} />;
}

function DrawnCelestialBodyPreview({ level, size }: { level: CelestialLevel; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const radius = celestialBodyRadius(level);
    const radiusRatio = level === CelestialLevel.Saturn ? 0.32 : 0.42;
    const scale = (size * radiusRatio) / radius;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(size / 2, size / 2);
    ctx.scale(scale, scale);
    drawCelestialBody(ctx, { level, x: 0, y: 0 });
  }, [level, size]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={CELESTIAL_BODIES[level].name}
      className="shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
