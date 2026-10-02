import type { AudioContextStore, BrowserAudioContext } from "./audioContext";

const MILLISECONDS_PER_SECOND = 1000;
const NOTE_SECONDS = 5;
const BGM_GAIN = 0.5;
const SILENT_GAIN = 0.001;
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
const MELODY_FREQUENCIES = [...frogfucius_suite_18, ...moleville_blues, ...monstro_town_star_song];
const LOOP_SECONDS = (MELODY_FREQUENCIES.length + RANDOM_MELODY_NOTE_COUNT) * NOTE_SECONDS;
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
  let bgmTimer: number | null = null;
  let isPlaying = false;
  const activeGains = new Set<GainNode>();

  const scheduleBgmLoop = (context: BrowserAudioContext, startTime: number) => {
    if (!isPlaying) return;

    const melodyFrequencies = [...MELODY_FREQUENCIES, ...createRandomMelodyFrequencies()];

    melodyFrequencies.forEach((frequency, index) => {
      const noteStart = startTime + index * NOTE_SECONDS;
      const noteEnd = noteStart + NOTE_SECONDS;
      const notePeak = noteStart + NOTE_SECONDS / 2;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      gain.gain.setValueAtTime(SILENT_GAIN, noteStart);
      gain.gain.linearRampToValueAtTime(BGM_GAIN, notePeak);
      gain.gain.exponentialRampToValueAtTime(SILENT_GAIN, noteEnd);

      oscillator.connect(gain);
      gain.connect(context.destination);
      activeGains.add(gain);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd);
      oscillator.addEventListener("ended", () => {
        oscillator.disconnect();
        if (activeGains.delete(gain)) {
          gain.disconnect();
        }
      });
    });
  };

  const start = () => {
    const context = getAudioContext();
    if (!context || isPlaying) return;
    isPlaying = true;

    const scheduleNextLoop = () => {
      const nextContext = getAudioContext();
      if (!nextContext || !isPlaying) return;
      scheduleBgmLoop(nextContext, nextContext.currentTime);
      bgmTimer = window.setTimeout(scheduleNextLoop, LOOP_SECONDS * MILLISECONDS_PER_SECOND);
    };

    void context.resume();
    scheduleNextLoop();
  };

  const stop = () => {
    if (bgmTimer !== null) {
      window.clearTimeout(bgmTimer);
      bgmTimer = null;
    }
    isPlaying = false;
    activeGains.forEach((gain) => {
      gain.disconnect();
    });
    activeGains.clear();
  };

  return { start, stop };
}
