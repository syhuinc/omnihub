/**
 * A from-scratch, honest approximation of Auto-Tune-style pitch correction — not studio-grade
 * (real pitch-correction plugins use much heavier DSP: phase-vocoder or PSOLA resynthesis with
 * proper formant preservation). This uses simple time-domain techniques throughout, entirely in
 * plain JS with no external library:
 *
 * 1. Pitch detection via windowed autocorrelation (coarse-then-fine lag search).
 * 2. For each analysis window, snap the detected pitch to the nearest note in the chosen
 *    key/scale, blended by "strength" (0 = no correction, 1 = snap fully).
 * 3. Resynthesis via simple overlap-add granular resampling: each grain is independently
 *    resampled toward its target pitch and pasted back at a fixed hop with a Hann window for a
 *    smooth crossfade. This is a lightweight stand-in for real formant-preserving pitch shifting,
 *    so extreme correction can sound a bit "warbly" rather than perfectly clean — an expected
 *    trade-off of keeping this dependency-free.
 * 4. "Formant" is approximated as a brightness tilt (a shelving filter) applied afterward, not a
 *    true formant shift, since real formant correction needs spectral-envelope separation this
 *    approach doesn't have.
 */

export type ScaleName = 'Major' | 'Minor' | 'Chromatic';

export const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALE_INTERVALS: Record<ScaleName, number[]> = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

export interface AutoTunePreset {
  id: string;
  label: string;
  strength: number;
  responseSpeed: number;
  formant: number;
}

export const AUTOTUNE_PRESETS: AutoTunePreset[] = [
  { id: 'natural', label: 'Natural', strength: 0.35, responseSpeed: 0.3, formant: 0 },
  { id: 'pop', label: 'Pop', strength: 0.65, responseSpeed: 0.55, formant: 0.1 },
  { id: 'hardtune', label: 'Hard Tune', strength: 1, responseSpeed: 0.9, formant: 0 },
  { id: 'robot', label: 'Robot', strength: 1, responseSpeed: 1, formant: -0.2 },
];

export interface AutoTuneOptions {
  keyRoot: number; // 0-11 (see KEY_NAMES)
  scale: ScaleName;
  autoDetectKey: boolean;
  strength: number; // 0-1
  responseSpeed: number; // 0-1, larger = smaller analysis grain = snappier but choppier
  pitchCorrectionSemitones: number; // manual transpose applied on top of scale-snapping, -12..12
  formant: number; // -1..1, "deep" .. "bright" brightness tilt
}

const DETECT_WINDOW = 1024;
const MIN_FREQ = 70;
const MAX_FREQ = 800;

function hann(i: number, n: number): number {
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
}

/** Windowed autocorrelation pitch detection. Returns 0 for silence/unvoiced frames. */
export function detectPitch(frame: Float32Array, sampleRate: number): number {
  let rms = 0;
  for (let i = 0; i < frame.length; i++) rms += frame[i] * frame[i];
  rms = Math.sqrt(rms / frame.length);
  if (rms < 0.01) return 0;

  const minLag = Math.max(1, Math.floor(sampleRate / MAX_FREQ));
  const maxLag = Math.min(frame.length - 1, Math.floor(sampleRate / MIN_FREQ));
  if (maxLag <= minLag) return 0;

  // Coarse pass (step 3) to find the neighborhood, then a fine ±3 refinement — a rough 3x
  // speedup over a full linear scan, which matters since this runs once per analysis grain
  // across the whole clip.
  let bestLag = -1;
  let bestCorr = 0;
  for (let lag = minLag; lag <= maxLag; lag += 3) {
    let corr = 0;
    for (let i = 0; i < frame.length - lag; i++) corr += frame[i] * frame[i + lag];
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  if (bestLag < 0) return 0;

  const refineFrom = Math.max(minLag, bestLag - 3);
  const refineTo = Math.min(maxLag, bestLag + 3);
  for (let lag = refineFrom; lag <= refineTo; lag++) {
    let corr = 0;
    for (let i = 0; i < frame.length - lag; i++) corr += frame[i] * frame[i + lag];
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  return bestLag > 0 ? sampleRate / bestLag : 0;
}

function freqToMidi(f: number): number {
  return 69 + 12 * Math.log2(f / 440);
}

function midiToFreq(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12);
}

function detectPitchesForBuffer(mono: Float32Array, sampleRate: number): Float32Array {
  const numBlocks = Math.max(1, Math.ceil(mono.length / DETECT_WINDOW));
  const pitches = new Float32Array(numBlocks);
  for (let b = 0; b < numBlocks; b++) {
    const start = b * DETECT_WINDOW;
    const frame = mono.subarray(start, Math.min(start + DETECT_WINDOW, mono.length));
    pitches[b] = frame.length >= 64 ? detectPitch(frame, sampleRate) : 0;
  }
  return pitches;
}

/** Median detected pitch class across the clip, for the Auto-Detect key display/behavior. Returns
 *  null if the clip has no clearly voiced content to go on. */
export function detectDominantKey(buffer: AudioBuffer): number | null {
  const mono = buffer.getChannelData(0);
  const pitches = Array.from(detectPitchesForBuffer(mono, buffer.sampleRate)).filter((f) => f > 0);
  if (pitches.length === 0) return null;
  pitches.sort((a, b) => a - b);
  const median = pitches[Math.floor(pitches.length / 2)];
  return ((Math.round(freqToMidi(median)) % 12) + 12) % 12;
}

export async function renderAutoTune(buffer: AudioBuffer, opts: AutoTuneOptions): Promise<AudioBuffer> {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const inputData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) inputData.push(buffer.getChannelData(c));
  const mono = inputData[0];

  const keyRoot = opts.autoDetectKey ? (detectDominantKey(buffer) ?? opts.keyRoot) : opts.keyRoot;
  const scaleSet = new Set(SCALE_INTERVALS[opts.scale].map((iv) => (keyRoot + iv) % 12));

  function nearestScaleMidi(midi: number): number {
    const rounded = Math.round(midi);
    let best = rounded;
    let bestDist = Infinity;
    for (let d = -6; d <= 6; d++) {
      const cand = rounded + d;
      const pc = ((cand % 12) + 12) % 12;
      if (scaleSet.has(pc)) {
        const dist = Math.abs(cand - midi);
        if (dist < bestDist) {
          bestDist = dist;
          best = cand;
        }
      }
    }
    return best + opts.pitchCorrectionSemitones;
  }

  const detectedPitches = detectPitchesForBuffer(mono, sampleRate);

  // Response speed trades grain size for responsiveness: smaller grains track fast pitch
  // changes more closely but sound choppier; larger grains sound smoother but lag behind.
  const hop = Math.round(1536 - opts.responseSpeed * 1024);
  const grainWindow = hop * 2;

  const outLength = mono.length;
  // Explicit ArrayBuffer (not the plain `new Float32Array(n)` form) so these are typed as
  // ArrayBuffer-backed, since copyToChannel below requires that under recent TS DOM lib typings.
  const outChannels: Float32Array<ArrayBuffer>[] = [];
  for (let c = 0; c < numChannels; c++) outChannels.push(new Float32Array(new ArrayBuffer(outLength * 4)));
  const weightSum = new Float32Array(outLength);

  const numGrains = Math.ceil(outLength / hop) + 1;
  for (let g = 0; g < numGrains; g++) {
    const center = g * hop;
    if (center >= outLength) break;
    const detectBlock = Math.min(detectedPitches.length - 1, Math.floor(center / DETECT_WINDOW));
    const f0 = detectedPitches[detectBlock];

    let ratio = 1;
    if (f0 > 0 && opts.strength > 0.001) {
      const targetMidi = nearestScaleMidi(freqToMidi(f0));
      const idealRatio = midiToFreq(targetMidi) / f0;
      ratio = 1 + opts.strength * (idealRatio - 1);
      ratio = Math.max(0.5, Math.min(2, ratio));
    }

    const grainStart = center - grainWindow / 2;
    for (let c = 0; c < numChannels; c++) {
      const src = inputData[c];
      const out = outChannels[c];
      for (let i = 0; i < grainWindow; i++) {
        const srcPos = grainStart + i * ratio;
        const idx = Math.floor(srcPos);
        const frac = srcPos - idx;
        const s0 = idx >= 0 && idx < src.length ? src[idx] : 0;
        const s1 = idx + 1 >= 0 && idx + 1 < src.length ? src[idx + 1] : 0;
        const sample = s0 + (s1 - s0) * frac;
        const outPos = grainStart + i;
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

  // Formant approximation: a brightness tilt, applied as a separate lightweight offline pass
  // since the resynthesis above is raw array math, not an audio graph.
  const ctx = new OfflineAudioContext(numChannels, outLength, sampleRate);
  const resynthesized = ctx.createBuffer(numChannels, outLength, sampleRate);
  for (let c = 0; c < numChannels; c++) resynthesized.copyToChannel(outChannels[c], c);

  if (Math.abs(opts.formant) < 0.01) return resynthesized;

  const source = ctx.createBufferSource();
  source.buffer = resynthesized;
  const shelf = ctx.createBiquadFilter();
  shelf.type = 'highshelf';
  shelf.frequency.value = 2500;
  shelf.gain.value = opts.formant * 12;
  source.connect(shelf);
  shelf.connect(ctx.destination);
  source.start(0);
  return ctx.startRendering();
}
