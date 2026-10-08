export type BrowserAudioContext = AudioContext & {
  createOscillator(): OscillatorNode;
  createGain(): GainNode;
};

type WindowWithAudioContext = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function createAudioContextStore() {
  let audioContext: BrowserAudioContext | null = null;

  const getAudioContext = () => {
    if (audioContext) return audioContext;

    const AudioContextConstructor =
      window.AudioContext ?? (window as WindowWithAudioContext).webkitAudioContext;
    if (!AudioContextConstructor) return null;

    audioContext = new AudioContextConstructor() as BrowserAudioContext;
    return audioContext;
  };

  const unlock = () => {
    void getAudioContext()?.resume();
  };

  return { getAudioContext, unlock };
}

export type AudioContextStore = ReturnType<typeof createAudioContextStore>;
