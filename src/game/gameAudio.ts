import { createAudioContextStore } from "./audio/audioContext";
import { createBgmPlayer } from "./audio/bgm";
import { createSoundEffectPlayer } from "./audio/soundEffect";
import { CELESTIAL_PROGRESSION, type CelestialLevel } from "./celestialBodies";

export function createGameAudio() {
  const audioContextStore = createAudioContextStore();
  const soundEffect = createSoundEffectPlayer(audioContextStore, {
    pitchSlotCount: CELESTIAL_PROGRESSION.length,
  });
  const bgm = createBgmPlayer(audioContextStore);

  return {
    playMerge: (level: CelestialLevel) => soundEffect.playMerge(level),
    startBgm: bgm.start,
    stopBgm: bgm.stop,
    unlock: audioContextStore.unlock,
  };
}
