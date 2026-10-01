import { BOARD_HEIGHT, BOARD_WIDTH } from "../game/board";
import { drawBoard } from "../game/rendering/draw";
import { GameEngine, type GameSnapshot } from "../game/GameEngine";
import { useCallback, useEffect, useRef, useState } from "react";
import { CelestialMergeView } from "./CelestialMergeView";

const MILLISECONDS_PER_SECOND = 1_000;

type ViewState = Pick<GameSnapshot, "score" | "nextDropLevel" | "isGameOver">;

function selectViewState(snapshot: GameSnapshot): ViewState {
  return {
    score: snapshot.score,
    nextDropLevel: snapshot.nextDropLevel,
    isGameOver: snapshot.isGameOver,
  };
}

export function CelestialMerge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep one engine instance for the component lifetime. This is not render state;
  // lazy useState avoids the react(refs) warning caused by reading ref.current during render.
  const [engine] = useState(() => new GameEngine());
  const [viewState, setViewState] = useState(() => selectViewState(engine.snapshot()));

  const syncViewState = useCallback((snapshot: GameSnapshot) => {
    const next = selectViewState(snapshot);
    setViewState((previous) =>
      previous.score === next.score &&
      previous.nextDropLevel === next.nextDropLevel &&
      previous.isGameOver === next.isGameOver
        ? previous
        : next,
    );
  }, []);

  const resetGame = useCallback(() => {
    engine.reset();
    syncViewState(engine.snapshot());
  }, [engine, syncViewState]);

  const dropCelestialBody = useCallback(() => {
    if (engine.drop()) syncViewState(engine.snapshot());
  }, [engine, syncViewState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = createCanvasResizer(canvas, ctx);
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const stopGameLoop = startGameLoop(ctx, engine, syncViewState);

    return () => {
      stopGameLoop();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [engine, syncViewState]);

  const updateDropX = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dropX = ((clientX - rect.left) / rect.width) * BOARD_WIDTH;
    engine.setDropX(dropX);
  };

  return (
    <CelestialMergeView
      canvasRef={canvasRef}
      displayedScore={viewState.score}
      nextDropLevel={viewState.nextDropLevel}
      isGameOver={viewState.isGameOver}
      onDropXChange={updateDropX}
      onDrop={dropCelestialBody}
      onReset={resetGame}
    />
  );
}

function createCanvasResizer(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  return () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = BOARD_WIDTH * dpr;
    canvas.height = BOARD_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
}

function startGameLoop(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  syncViewState: (snapshot: GameSnapshot) => void,
) {
  let animationFrameId = 0;
  let previousTime = performance.now();

  const runAnimationFrame = (currentTime: number) => {
    engine.advance((currentTime - previousTime) / MILLISECONDS_PER_SECOND);
    previousTime = currentTime;

    const snapshot = engine.snapshot();
    drawBoard(ctx, {
      bodies: snapshot.bodies,
      dropX: snapshot.dropX,
      dropLevel: snapshot.dropLevel,
      gameOver: snapshot.isGameOver,
      canDrop: snapshot.canDrop,
    });
    syncViewState(snapshot);
    animationFrameId = requestAnimationFrame(runAnimationFrame);
  };

  animationFrameId = requestAnimationFrame(runAnimationFrame);
  return () => cancelAnimationFrame(animationFrameId);
}
