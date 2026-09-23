/**
 * Synthesized ambient loops for Sleep Sounds — filtered/modulated noise generated on-device with
 * the Web Audio API, not licensed field recordings (we don't have any). Each sound is a rough
 * character approximation, not a literal "rain" or "ocean" recording.
 */

type SoundId = 'rain' | 'forest' | 'ocean' | 'night-ambience' | 'campfire' | 'cafe';

interface ActiveSound {
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  lfo?: OscillatorNode;
}

let audioCtx: AudioContext | null = null;
let active: ActiveSound | null = null;
let activeId: SoundId | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const seconds = 4;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    // Light brownian smoothing so raw white noise doesn't sound harsh/hissy on its own.
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 8;
  }
  noiseBuffer = buffer;
  return buffer;
}

const SOUND_PARAMS: Record<SoundId, { filterType: BiquadFilterType; freq: number; q: number; lfoHz?: number; lfoDepth?: number }> = {
  rain: { filterType: 'highpass', freq: 1200, q: 0.6 },
  forest: { filterType: 'bandpass', freq: 900, q: 0.9 },
  ocean: { filterType: 'lowpass', freq: 500, q: 0.5, lfoHz: 0.12, lfoDepth: 0.4 },
  'night-ambience': { filterType: 'lowpass', freq: 300, q: 0.4 },
  campfire: { filterType: 'lowpass', freq: 700, q: 1.2, lfoHz: 3.5, lfoDepth: 0.15 },
  cafe: { filterType: 'bandpass', freq: 1500, q: 0.7 },
};

export function playSound(id: SoundId, volume: number): void {
  stopSound();
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();

  const params = SOUND_PARAMS[id];
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = params.filterType;
  filter.frequency.value = params.freq;
  filter.Q.value = params.q;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  let lfo: OscillatorNode | undefined;
  if (params.lfoHz) {
    lfo = ctx.createOscillator();
    lfo.frequency.value = params.lfoHz;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = volume * (params.lfoDepth ?? 0.3);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
  }

  source.start();
  active = { source, filter, gain, lfo };
  activeId = id;
}

export function setVolume(volume: number): void {
  if (active) active.gain.gain.value = volume;
}

export function stopSound(): void {
  if (active) {
    try {
      active.source.stop();
      active.lfo?.stop();
    } catch {
      // already stopped — ignore
    }
    active.source.disconnect();
    active.filter.disconnect();
    active.gain.disconnect();
    active = null;
    activeId = null;
  }
}

export function getActiveSoundId(): SoundId | null {
  return activeId;
}
