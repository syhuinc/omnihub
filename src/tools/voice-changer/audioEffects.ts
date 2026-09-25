import lamejs from './vendor/lamejs-bundle.js';

const { Mp3Encoder } = lamejs;

export type EffectCategory = 'fun' | 'character' | 'special';

export interface EffectDef {
  id: string;
  label: string;
  category: EffectCategory;
  /** Each effect's own accent color, so the grid reads as a set of distinct characters rather
   *  than one flat purple wash — mirrors the colorful per-effect icons in the reference design.
   *  The icon artwork itself lives in src/assets/voice-changer (EFFECT_IMAGES), keyed by id. */
  color: string;
}

/** id 'normal' is the only one every screen treats as "no effect" — kept out of the rate/processing
 *  tables below since it's a pure passthrough. */
export const EFFECTS: EffectDef[] = [
  { id: 'normal', label: 'Normal', category: 'fun', color: '#8b5cf6' },
  { id: 'chipmunk', label: 'Chipmunk', category: 'fun', color: '#f97316' },
  { id: 'fast', label: 'Fast', category: 'fun', color: '#06b6d4' },
  { id: 'slow', label: 'Slow', category: 'fun', color: '#14b8a6' },
  { id: 'deep', label: 'Deep Voice', category: 'character', color: '#4f46e5' },
  { id: 'baby', label: 'Baby Voice', category: 'character', color: '#ec4899' },
  { id: 'robot', label: 'Robot', category: 'character', color: '#64748b' },
  { id: 'alien', label: 'Alien', category: 'character', color: '#22c55e' },
  { id: 'monster', label: 'Monster', category: 'character', color: '#ef4444' },
  { id: 'echo', label: 'Echo', category: 'special', color: '#3b82f6' },
  { id: 'radio', label: 'Radio', category: 'special', color: '#f59e0b' },
  { id: 'megaphone', label: 'Megaphone', category: 'special', color: '#f43f5e' },
  { id: 'distorted', label: 'Distorted', category: 'special', color: '#a855f7' },
  { id: 'karaoke', label: 'Karaoke', category: 'special', color: '#eab308' },
];

export function getEffect(id: string): EffectDef {
  return EFFECTS.find((e) => e.id === id) ?? EFFECTS[0];
}

/** The playback-rate contribution of a single effect at a given intensity (0-1, default 0.5).
 *  1 = no change. Multiple effects (Voice Mixer) multiply their rates together onto the one
 *  BufferSourceNode a render pass has. 'fast'/'slow' are deliberately absent here — they're pure
 *  tempo changes handled by timeStretch() below instead, so they read as the same voice sped up
 *  or slowed down rather than turning into a different pitched character like chipmunk/deep. */
function rateFor(effectId: string, intensity: number): number {
  switch (effectId) {
    case 'chipmunk':
      return 1 + intensity * 0.9;
    case 'deep':
      return 1 - intensity * 0.55;
    case 'baby':
      return 1 + intensity * 0.75;
    case 'alien':
      return 1 + intensity * 0.4;
    case 'monster':
      return 1 - intensity * 0.6;
    default:
      return 1;
  }
}

/** Tempo-only speed factor for 'fast'/'slow' (>1 = shorter/faster, <1 = longer/slower), consumed
 *  by timeStretch() rather than rateFor() so they don't also shift pitch. */
function tempoFor(effectId: string, intensity: number): number {
  switch (effectId) {
    case 'fast':
      return 1 + intensity * 0.6;
    case 'slow':
      return 1 - intensity * 0.5;
    default:
      return 1;
  }
}

function hann(i: number, n: number): number {
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
}

/** Pitch-preserving tempo change for the 'fast'/'slow' effects: output grains are written at a
 *  fixed hop while the matching input grain is read from a position that advances by
 *  hop * speedFactor — i.e. we change *where* we read from, not *how fast* we read it, so no
 *  per-sample resampling (and therefore no pitch shift) happens, only how much source content is
 *  skipped or repeated between grains. A lightweight fixed-hop OLA (not full WSOLA with
 *  cross-correlation grain alignment), so sustained vowels can flutter slightly at extreme
 *  settings — the same honest trade-off the auto-tune resynthesis above documents. */
function timeStretch(buffer: AudioBuffer, speedFactor: number): AudioBuffer {
  const numChannels = buffer.numberOfChannels;
  const inputData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) inputData.push(buffer.getChannelData(c));

  const hop = 1024;
  const grainWindow = hop * 2;
  const outLength = Math.max(1, Math.round(buffer.length / speedFactor));

  const outChannels: Float32Array<ArrayBuffer>[] = [];
  for (let c = 0; c < numChannels; c++) outChannels.push(new Float32Array(new ArrayBuffer(outLength * 4)));
  const weightSum = new Float32Array(outLength);

  const numGrains = Math.ceil(outLength / hop) + 1;
  for (let g = 0; g < numGrains; g++) {
    const outCenter = g * hop;
    if (outCenter >= outLength) break;
    const inCenter = outCenter * speedFactor;
    const inStart = inCenter - grainWindow / 2;
    const outStart = outCenter - grainWindow / 2;
    for (let c = 0; c < numChannels; c++) {
      const src = inputData[c];
      const out = outChannels[c];
      for (let i = 0; i < grainWindow; i++) {
        const srcPos = inStart + i;
        const idx = Math.floor(srcPos);
        const frac = srcPos - idx;
        const s0 = idx >= 0 && idx < src.length ? src[idx] : 0;
        const s1 = idx + 1 >= 0 && idx + 1 < src.length ? src[idx + 1] : 0;
        const sample = s0 + (s1 - s0) * frac;
        const outPos = Math.round(outStart) + i;
        if (outPos >= 0 && outPos < outLength) {
          const w = hann(i, grainWindow);
          out[outPos] += sample * w;
          if (c === 0) weightSum[outPos] += w;
        }
      }
    }
  }

  for (let c = 0; c < numChannels; c++) {
    const out = outChannels[c];
    for (let i = 0; i < outLength; i++) {
      const w = weightSum[i];
      if (w > 0.0001) out[i] = out[i] / w;
    }
  }

  const scratchCtx = new OfflineAudioContext(numChannels, outLength, buffer.sampleRate);
  const result = scratchCtx.createBuffer(numChannels, outLength, buffer.sampleRate);
  for (let c = 0; c < numChannels; c++) result.copyToChannel(outChannels[c], c);
  return result;
}

/** Classic WebAudio soft-clip distortion curve (the standard formula cited in MDN's WaveShaperNode
 *  example) — a cheap, well-known way to get analog-style grit without modeling real circuitry. */
function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const k = Math.max(0, amount) * 100;
  const n = 44100;
  // WaveShaperNode.curve requires an ArrayBuffer-backed (not SharedArrayBuffer-compatible)
  // Float32Array under recent TS DOM lib typings — constructing from an explicit ArrayBuffer
  // pins the generic, unlike the plain `new Float32Array(n)` form.
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

/** Inserts one effect's non-rate processing (filters, ring modulation, distortion, delay) into the
 *  chain and returns the new output node. Rate is handled separately (see rateFor) since it lives
 *  on the shared BufferSourceNode, not per-effect. Pure rate effects (chipmunk/deep) add no nodes
 *  here and just pass the input straight through; fast/slow never reach this function at all (see
 *  timeStretch/tempoFor). */
function applyProcessing(ctx: BaseAudioContext, input: AudioNode, effectId: string, intensity: number): AudioNode {
  switch (effectId) {
    case 'baby': {
      // The old version was just a highpass at 300-800Hz, which strips out the fundamental and
      // low harmonics of most voices entirely (rather than the pitch shift alone), leaving a
      // thin, telephone-y sound that doesn't read as "baby" at all. A real baby's voice is
      // higher-pitched (handled by rateFor) AND has higher, brighter formants from a much
      // smaller vocal tract — approximated here with a gentle low-end trim plus a shelf/peak
      // boost in the 2-4kHz "baby coo" brightness range, instead of removing the voice's body.
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 90;
      const shelf = ctx.createBiquadFilter();
      shelf.type = 'highshelf';
      shelf.frequency.value = 2200;
      shelf.gain.value = 5 + intensity * 8;
      const peak = ctx.createBiquadFilter();
      peak.type = 'peaking';
      peak.frequency.value = 3200;
      peak.Q.value = 1.1;
      peak.gain.value = 4 + intensity * 6;
      input.connect(hp);
      hp.connect(shelf);
      shelf.connect(peak);
      return peak;
    }
    case 'robot':
    case 'alien': {
      const modGain = ctx.createGain();
      modGain.gain.value = 0;
      const carrier = ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.value = effectId === 'robot' ? 20 + intensity * 60 : 30 + intensity * 90;
      carrier.connect(modGain.gain);
      carrier.start(0);
      input.connect(modGain);
      return modGain;
    }
    case 'monster': {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900 - intensity * 500;
      const shaper = ctx.createWaveShaper();
      shaper.curve = makeDistortionCurve(intensity * 0.25);
      input.connect(lp);
      lp.connect(shaper);
      return shaper;
    }
    case 'echo': {
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.15 + intensity * 0.25;
      const feedback = ctx.createGain();
      feedback.gain.value = Math.min(0.75, 0.2 + intensity * 0.5);
      const merged = ctx.createGain();
      input.connect(merged);
      input.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(merged);
      return merged;
    }
    case 'radio': {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1200;
      bp.Q.value = 1 + intensity * 4;
      const shaper = ctx.createWaveShaper();
      shaper.curve = makeDistortionCurve(intensity * 0.15);
      input.connect(bp);
      bp.connect(shaper);
      return shaper;
    }
    case 'megaphone': {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1500;
      bp.Q.value = 1.5;
      const shaper = ctx.createWaveShaper();
      shaper.curve = makeDistortionCurve(0.25 + intensity * 0.5);
      input.connect(bp);
      bp.connect(shaper);
      return shaper;
    }
    case 'distorted': {
      const shaper = ctx.createWaveShaper();
      shaper.curve = makeDistortionCurve(0.15 + intensity * 0.75);
      input.connect(shaper);
      return shaper;
    }
    case 'karaoke': {
      // A "sing-along on stage" treatment, not literal vocal-removal — this app only ever has the
      // one recorded voice track (no separate backing track to isolate vocals from), so a real
      // center-channel-cancellation karaoke effect has nothing to cancel against. A gentle
      // soft-clip for consistency plus a hall convolution reverb is the honest, audible stand-in.
      const shaper = ctx.createWaveShaper();
      shaper.curve = makeDistortionCurve(0.05 + intensity * 0.1);
      const convolver = ctx.createConvolver();
      convolver.buffer = generateImpulseResponse(ctx, 1.2 + intensity * 0.8, 2.5);
      const dry = ctx.createGain();
      dry.gain.value = 0.65;
      const wet = ctx.createGain();
      wet.gain.value = 0.3 + intensity * 0.3;
      const merged = ctx.createGain();
      input.connect(shaper);
      shaper.connect(dry);
      dry.connect(merged);
      shaper.connect(convolver);
      convolver.connect(wet);
      wet.connect(merged);
      return merged;
    }
    default:
      return input;
  }
}

function extraTailSeconds(effectIds: string[], intensity: number): number {
  let tail = 0;
  if (effectIds.includes('echo')) tail = Math.max(tail, 0.15 + intensity * 0.25 + 1.0);
  if (effectIds.includes('karaoke')) tail = Math.max(tail, 1.2 + intensity * 0.8 + 0.5);
  return tail;
}

/** Renders one or more effects (Voice Mixer combines several; every other screen passes a single
 *  id) into a brand new AudioBuffer via OfflineAudioContext, so the result is a plain,
 *  deterministic buffer usable for preview playback and for the shared/saved file alike. */
export async function renderEffects(buffer: AudioBuffer, effectIds: string[], intensity = 0.5): Promise<AudioBuffer> {
  const active = effectIds.filter((id) => id !== 'normal');
  if (active.length === 0) return buffer;

  // Fast/Slow are pure tempo changes, rendered as a distinct time-stretch pre-pass (see
  // timeStretch) so they never share the pitch-shifting playbackRate below — otherwise they'd
  // sound like weaker versions of Chipmunk/Deep Voice instead of the same voice at a different
  // speed.
  const tempoIds = active.filter((id) => id === 'fast' || id === 'slow');
  const pitchIds = active.filter((id) => id !== 'fast' && id !== 'slow');

  let working = buffer;
  if (tempoIds.length > 0) {
    const speedFactor = tempoIds.reduce((s, id) => s * tempoFor(id, intensity), 1);
    working = timeStretch(working, Math.max(0.4, Math.min(2.5, speedFactor)));
  }
  if (pitchIds.length === 0) return working;

  const rate = pitchIds.reduce((r, id) => r * rateFor(id, intensity), 1);
  const clampedRate = Math.max(0.3, Math.min(3, rate));
  const tailSamples = Math.ceil(extraTailSeconds(pitchIds, intensity) * working.sampleRate);
  const outLength = Math.ceil(working.length / clampedRate) + tailSamples;

  const ctx = new OfflineAudioContext(working.numberOfChannels, outLength, working.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = working;
  source.playbackRate.value = clampedRate;

  let node: AudioNode = source;
  for (const id of pitchIds) node = applyProcessing(ctx, node, id, intensity);

  node.connect(ctx.destination);
  source.start(0);
  return ctx.startRendering();
}

export async function renderEffect(buffer: AudioBuffer, effectId: string, intensity = 0.5): Promise<AudioBuffer> {
  return renderEffects(buffer, [effectId], intensity);
}

export interface PitchSpeedOptions {
  /** Semitones, roughly -12..+12. */
  semitones: number;
  /** 1 = normal speed. */
  speed: number;
}

/** A dedicated continuous pitch/speed tool. Both controls live on the same BufferSourceNode
 *  playback rate (there's no independent time-stretch without much heavier DSP — see autotune.ts
 *  for where that complexity actually gets spent), so moving one slider does audibly affect the
 *  other; that's an honest, standard trade-off for this style of simple tool, not a bug. */
export async function renderPitchSpeed(buffer: AudioBuffer, opts: PitchSpeedOptions): Promise<AudioBuffer> {
  const pitchRate = Math.pow(2, opts.semitones / 12);
  const rate = Math.max(0.3, Math.min(3, pitchRate * opts.speed));
  const outLength = Math.ceil(buffer.length / rate);

  const ctx = new OfflineAudioContext(buffer.numberOfChannels, outLength, buffer.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  source.connect(ctx.destination);
  source.start(0);
  return ctx.startRendering();
}

/** A synthetic room impulse response — exponentially-decaying filtered noise — rather than a
 *  licensed/recorded IR file (we don't have one), convolved in to approximate reverb. */
function generateImpulseResponse(ctx: BaseAudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(rate * seconds));
  const impulse = ctx.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c++) {
    const data = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

export interface EchoReverbOptions {
  delayTime: number; // seconds
  feedback: number; // 0-0.85
  echoMix: number; // 0-1
  reverbDecaySeconds: number; // 0.2-3
  reverbMix: number; // 0-1
}

export async function renderEchoReverb(buffer: AudioBuffer, opts: EchoReverbOptions): Promise<AudioBuffer> {
  const tailSeconds = opts.delayTime * 4 + opts.reverbDecaySeconds + 0.5;
  const outLength = buffer.length + Math.ceil(tailSeconds * buffer.sampleRate);

  const ctx = new OfflineAudioContext(buffer.numberOfChannels, outLength, buffer.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const dry = ctx.createGain();
  dry.gain.value = 1;
  source.connect(dry);
  dry.connect(ctx.destination);

  if (opts.echoMix > 0.001) {
    const delay = ctx.createDelay(2.0);
    delay.delayTime.value = Math.max(0.01, opts.delayTime);
    const feedback = ctx.createGain();
    feedback.gain.value = Math.min(0.85, Math.max(0, opts.feedback));
    const wet = ctx.createGain();
    wet.gain.value = opts.echoMix;

    source.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(ctx.destination);
  }

  if (opts.reverbMix > 0.001) {
    const convolver = ctx.createConvolver();
    convolver.buffer = generateImpulseResponse(ctx, Math.max(0.2, opts.reverbDecaySeconds), 2.2);
    const wet = ctx.createGain();
    wet.gain.value = opts.reverbMix;
    source.connect(convolver);
    convolver.connect(wet);
    wet.connect(ctx.destination);
  }

  source.start(0);
  return ctx.startRendering();
}

/** Standard 16-bit PCM WAV encoder — MediaRecorder can't re-encode an already-processed
 *  AudioBuffer directly (it needs a live MediaStream), and a hand-rolled WAV writer is simpler
 *  and more deterministic than routing the rendered buffer back through a MediaStreamDestination
 *  and a second real-time recording pass. Browsers don't offer a native MP3 encoder, so WAV is
 *  the honest format to ship here rather than mislabeling the output. */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;

  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, s: string) {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) channelData.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channelData[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/** Real MPEG-1 Layer III encoding via lamejs (a pure-JS LAME port) — not a relabeled WAV. lamejs
 *  works in fixed blocks of 1152 samples per the MP3 frame spec, and only accepts mono or stereo,
 *  so a >2-channel buffer is downmixed to stereo first. */
export function audioBufferToMp3(buffer: AudioBuffer, kbps = 192): Blob {
  const numChannels = Math.min(2, buffer.numberOfChannels);
  const encoder = new Mp3Encoder(numChannels, buffer.sampleRate, kbps);

  const toInt16 = (data: Float32Array) => {
    const out = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      out[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return out;
  };

  const left = toInt16(buffer.getChannelData(0));
  const right = numChannels > 1 ? toInt16(buffer.getChannelData(1)) : undefined;

  // lamejs's Int8Array chunks come back typed as Int8Array<ArrayBufferLike>, which BlobPart
  // rejects (it wants a concrete ArrayBuffer, not the SharedArrayBuffer-inclusive union). Copying
  // bytes into a Uint8Array explicitly backed by `new ArrayBuffer(...)` pins the generic to a real
  // ArrayBuffer — same fix as makeDistortionCurve above, where `new Uint8Array(mp3buf)` alone still
  // infers ArrayBufferLike from the source and doesn't satisfy BlobPart.
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const blockSize = 1152;
  function toArrayBufferBacked(src: Int8Array): Uint8Array<ArrayBuffer> {
    const out = new Uint8Array(new ArrayBuffer(src.length));
    out.set(src);
    return out;
  }
  for (let i = 0; i < left.length; i += blockSize) {
    const leftChunk = left.subarray(i, i + blockSize);
    const rightChunk = right?.subarray(i, i + blockSize);
    const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) chunks.push(toArrayBufferBacked(mp3buf));
  }
  const tail = encoder.flush();
  if (tail.length > 0) chunks.push(toArrayBufferBacked(tail));

  return new Blob(chunks, { type: 'audio/mpeg' });
}

export function extensionForBlob(blob: Blob): string {
  return blob.type === 'audio/mpeg' ? 'mp3' : 'wav';
}
