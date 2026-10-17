import type { RefObject } from "react";

import { CELESTIAL_BODIES, CELESTIAL_PROGRESSION, CelestialLevel } from "./game/celestialBodies";

const NEXT_BODY_PREVIEW_SIZE = 24;

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
    "Click or tap to drop a celestial body.",
    "Merge matching celestial bodies to create the next one.",
    "The game ends if any whole body stays above the red dashed line for 5 seconds.",
  ];

  return (
    <div
      className="bg-background text-foreground grid min-h-screen content-center justify-center overflow-auto bg-cover bg-center p-4"
      style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}bg_moon_getsumen.webp)`,
        gridTemplateColumns: "minmax(0, min(calc(100vw - 2rem), calc((100svh - 13rem) * 9 / 14)))",
      }}
    >
      <header className="mb-2 flex flex-wrap items-center gap-2 text-gray-100">
        <h1 className="text-xl font-bold">
          <a href="#">Celestial Merge</a>
        </h1>
        <div className="bg-foreground/3 ml-auto grid justify-items-center rounded px-3 py-2 text-center">
          <span className="text-xs">Next</span>
          <CelestialBodyPreview level={nextDropLevel} />
        </div>
        <div className="bg-foreground/3 ml-auto grid justify-items-center rounded px-3 py-2 text-center">
          <span className="text-xs">Score</span>
          <strong>{displayedScore}</strong>
        </div>
      </header>

      <main>
        <div className="bg-foreground/3 relative overflow-hidden rounded border border-gray-500/50">
          <canvas
            ref={canvasRef}
            className="block w-full touch-none"
            onPointerDown={(event) => onDropXChange(event.clientX)}
            onPointerMove={(event) => onDropXChange(event.clientX)}
            onPointerUp={(event) => {
              onDropXChange(event.clientX);
              onDrop();
            }}
          />
          {isGameOver && (
            <div className="bg-background/50 absolute inset-0 flex flex-col items-center justify-center gap-3 rounded">
              <p>Game Over</p>
              <strong className="text-xl">{displayedScore} pts</strong>
              <button
                type="button"
                className="bg-foreground text-background cursor-pointer rounded px-4 py-2 text-sm font-medium motion-safe:transition motion-safe:active:translate-y-px"
                onClick={onReset}
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        <section className="bg-background/50 mt-2 rounded p-2 text-xs">
          <h2 className="mb-1">How to Play</h2>
          {helpTextLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <CelestialProgressionRow levels={CELESTIAL_PROGRESSION} />
        </section>
      </main>
    </div>
  );
}

function CelestialProgressionRow({ levels }: { levels: CelestialLevel[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {levels.map((level, index) => (
        <div key={level} className="flex gap-1">
          {index > 0 && <span>→</span>}
          <CelestialBodyPreview level={level} size={20} />
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
  return (
    <img
      src={definition.image}
      alt={definition.name}
      width={size}
      height={size}
      className="object-contain"
      style={{ width: size, height: size }}
    />
  );
}
