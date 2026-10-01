import type { AudioContextStore, BrowserAudioContext } from "./audioContext";
import { BGM_GAIN, MELODY_NOTE_GAIN, SILENT_GAIN } from "./audioLevels";

const MILLISECONDS_PER_SECOND = 1000;
const BGM_NOTE_SECONDS = 6;
const NOTE_FREQUENCIES = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G3: 196,
  A3: 220,
  B3: 246.94,
} as const;
const frogfucius_suite_18 = [
  NOTE_FREQUENCIES.G3,
  NOTE_FREQUENCIES.A3,
  NOTE_FREQUENCIES.E4,
  NOTE_FREQUENCIES.D4,
  NOTE_FREQUENCIES.C4,
  NOTE_FREQUENCIES.D4,
  NOTE_FREQUENCIES.C4,
  NOTE_FREQUENCIES.D4,
];
const moleville_blues = [
  NOTE_FREQUENCIES.E4,
  NOTE_FREQUENCIES.C4,
  NOTE_FREQUENCIES.G3,
  NOTE_FREQUENCIES.C4,
  NOTE_FREQUENCIES.D4,
  NOTE_FREQUENCIES.A3,
  NOTE_FREQUENCIES.B3,
  NOTE_FREQUENCIES.C4,
];
const monstro_town_star_song = [
  NOTE_FREQUENCIES.A3,
  NOTE_FREQUENCIES.B3,
  NOTE_FREQUENCIES.C4,
  NOTE_FREQUENCIES.D4,
  NOTE_FREQUENCIES.G3,
  NOTE_FREQUENCIES.C4,
  NOTE_FREQUENCIES.D4,
  NOTE_FREQUENCIES.E4,
];
const RANDOM_MELODY_NOTE_COUNT = 8;
const BGM_MELODY_FREQUENCIES = [
  ...frogfucius_suite_18,
  ...moleville_blues,
  ...monstro_town_star_song,
];
const BGM_LOOP_SECONDS =
  (BGM_MELODY_FREQUENCIES.length + RANDOM_MELODY_NOTE_COUNT) * BGM_NOTE_SECONDS;
const NOTE_FREQUENCY_VALUES = Object.values(NOTE_FREQUENCIES);

function randomFrequency() {
  const index = Math.floor(Math.random() * NOTE_FREQUENCY_VALUES.length);
  return NOTE_FREQUENCY_VALUES[index];
}

function createRandomMelodyFrequencies() {
  return Array.from({ length: RANDOM_MELODY_NOTE_COUNT }, () => {
    return randomFrequency();
  });
}

export function createBgmPlayer({ getAudioContext }: AudioContextStore) {
  let bgmGain: GainNode | null = null;
  let bgmTimer: number | null = null;

  const scheduleBgmLoop = (context: BrowserAudioContext, startTime: number) => {
    const output = bgmGain;
    if (!output) return;

    const melodyFrequencies = [...BGM_MELODY_FREQUENCIES, ...createRandomMelodyFrequencies()];

    melodyFrequencies.forEach((frequency, index) => {
      const noteStart = startTime + index * BGM_NOTE_SECONDS;
      const noteEnd = noteStart + BGM_NOTE_SECONDS;
      const notePeak = noteStart + BGM_NOTE_SECONDS / 2;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      gain.gain.setValueAtTime(SILENT_GAIN, noteStart);
      gain.gain.linearRampToValueAtTime(MELODY_NOTE_GAIN, notePeak);
      gain.gain.exponentialRampToValueAtTime(SILENT_GAIN, noteEnd);

      oscillator.connect(gain);
      gain.connect(output);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd);
      oscillator.addEventListener("ended", () => {
        oscillator.disconnect();
        gain.disconnect();
      });
    });
  };

  const start = () => {
    const context = getAudioContext();
    if (!context || bgmGain) return;

    bgmGain = context.createGain();
    bgmGain.gain.setValueAtTime(BGM_GAIN, context.currentTime);
    bgmGain.connect(context.destination);

    const scheduleNextLoop = () => {
      const nextContext = getAudioContext();
      if (!nextContext || !bgmGain) return;
      scheduleBgmLoop(nextContext, nextContext.currentTime);
      bgmTimer = window.setTimeout(scheduleNextLoop, BGM_LOOP_SECONDS * MILLISECONDS_PER_SECOND);
    };

    void context.resume();
    scheduleNextLoop();
  };

  const stop = () => {
    if (bgmTimer !== null) {
      window.clearTimeout(bgmTimer);
      bgmTimer = null;
    }
    bgmGain?.disconnect();
    bgmGain = null;
  };

  return { start, stop };
}
