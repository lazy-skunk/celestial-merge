import type { AudioContextStore } from "./audioContext";
import type { CelestialLevel } from "../game/celestialBodies";

const MIN_FREQUENCY_HZ = 440;
const MAX_FREQUENCY_HZ = 880;
const POP_DURATION_SECONDS = 0.1;
const SOUND_EFFECT_GAIN = 0.2;
const SILENT_GAIN = 0.001;

type SoundEffectOptions = Readonly<{
  pitchSlotCount: number;
}>;

export function createSoundEffectPlayer(
  { getAudioContext }: AudioContextStore,
  { pitchSlotCount }: SoundEffectOptions,
) {
  const playMerge = (level: CelestialLevel) => {
    const context = getAudioContext();
    if (!context) return;

    const startTime = context.currentTime;
    const endTime = startTime + POP_DURATION_SECONDS;
    const frequency = pitchSlotToFrequency(level, pitchSlotCount);
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(SOUND_EFFECT_GAIN, startTime);
    gain.gain.exponentialRampToValueAtTime(SILENT_GAIN, endTime);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startTime);
    oscillator.stop(endTime);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      gain.disconnect();
    });
  };

  return { playMerge };
}

export function pitchSlotToFrequency(pitchSlot: number, pitchSlotCount: number) {
  const normalizedPitchSlot = Math.max(0, pitchSlot);
  const pitchStepCount = pitchSlotCount - 1;
  if (pitchStepCount <= 0) return MIN_FREQUENCY_HZ;

  const pitchProgress = Math.min(normalizedPitchSlot, pitchStepCount) / pitchStepCount;
  return MIN_FREQUENCY_HZ + (MAX_FREQUENCY_HZ - MIN_FREQUENCY_HZ) * pitchProgress;
}
