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
    <main
      className="grid h-svh place-items-center overflow-auto bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${import.meta.env.BASE_URL}bg_moon_getsumen.webp)` }}
    >
      <section
        className="bg-background w-full rounded-lg p-4"
        style={{ maxWidth: "min(calc(100vw - 2rem), calc((100svh - 13rem) * 9 / 14))" }}
      >
        <header className="mb-2 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold">Celestial Merge</h1>
          <div className="bg-foreground/3 ml-auto grid justify-items-center rounded-lg px-3 py-2 text-center">
            <span className="text-xs">Next</span>
            <CelestialBodyPreview level={nextDropLevel} />
          </div>
          <div className="bg-foreground/3 ml-auto grid justify-items-center rounded-lg px-3 py-2 text-center">
            <span className="text-xs">Score</span>
            <strong>{displayedScore}</strong>
          </div>
        </header>

        <div className="bg-foreground/3 relative overflow-hidden rounded-lg">
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
            <div className="bg-background/75 absolute inset-0 flex flex-col items-center justify-center gap-3">
              <p>Game Over</p>
              <strong className="text-xl">{displayedScore} pts</strong>
              <button className="bg-foreground text-background rounded px-3 py-2" onClick={onReset}>
                Play Again
              </button>
            </div>
          )}
        </div>

        <section className="pt-2">
          <h2 className="mb-1 text-xs">Merge Guide</h2>
          <CelestialProgressionRow levels={CELESTIAL_PROGRESSION} />
        </section>

        <footer className="pt-3 text-xs">
          <span>
            {helpTextLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
        </footer>
      </section>
    </main>
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
