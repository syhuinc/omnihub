import type { IconName } from '../../components/Icon';

export type VoiceEffectId = 'original' | 'chipmunk' | 'deep' | 'robot' | 'echo' | 'alien';

export const VOICE_EFFECTS: { id: VoiceEffectId; label: string; icon: IconName }[] = [
  { id: 'original', label: 'Original', icon: 'mic' },
  { id: 'chipmunk', label: 'Chipmunk', icon: 'zap' },
  { id: 'deep', label: 'Deep Voice', icon: 'moon' },
  { id: 'robot', label: 'Robot', icon: 'cpu' },
  { id: 'echo', label: 'Echo', icon: 'repeat' },
  { id: 'alien', label: 'Alien', icon: 'star' },
];

/** Playback-rate change for the pitch-shifting effects — also shortens/lengthens duration, which
 *  is the classic, expected trade-off for this style of effect (real formant-preserving pitch
 *  shift needs much heavier DSP than a fun utility tool like this calls for). */
const PLAYBACK_RATE: Partial<Record<VoiceEffectId, number>> = {
  chipmunk: 1.55,
  deep: 0.72,
  alien: 1.28,
};

/** Ring-modulation carrier frequency — connecting a sine oscillator straight into a GainNode's
 *  own gain AudioParam, with the gain's base value left at 0, makes the gain equal the carrier
 *  wave itself, so the dry signal passing through gets multiplied by it. That's textbook ring
 *  modulation without needing a ScriptProcessor/AudioWorklet. */
const RING_MOD_HZ: Partial<Record<VoiceEffectId, number>> = {
  robot: 35,
  alien: 60,
};

const ECHO_TAIL_SECONDS = 1.2;

/** Renders an effect into a brand new AudioBuffer via OfflineAudioContext, so the result is a
 *  plain, deterministic buffer usable for both preview playback and exporting to a shareable
 *  WAV file — the same rendered buffer serves both purposes. */
export async function renderEffect(buffer: AudioBuffer, effect: VoiceEffectId): Promise<AudioBuffer> {
  if (effect === 'original') return buffer;

  const rate = PLAYBACK_RATE[effect] ?? 1;
  const tailSamples = effect === 'echo' ? Math.ceil(ECHO_TAIL_SECONDS * buffer.sampleRate) : 0;
  const outLength = Math.ceil(buffer.length / rate) + tailSamples;

  const ctx = new OfflineAudioContext(buffer.numberOfChannels, outLength, buffer.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;

  let node: AudioNode = source;

  const ringHz = RING_MOD_HZ[effect];
  if (ringHz) {
    const modGain = ctx.createGain();
    modGain.gain.value = 0;
    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = ringHz;
    carrier.connect(modGain.gain);
    carrier.start(0);
    node.connect(modGain);
    node = modGain;
  }

  if (effect === 'echo') {
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.22;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.35;
    const merged = ctx.createGain();

    node.connect(merged);
    node.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(merged);
    node = merged;
  }

  node.connect(ctx.destination);
  source.start(0);
  return ctx.startRendering();
}

/** Standard 16-bit PCM WAV encoder — MediaRecorder can't re-encode an already-processed
 *  AudioBuffer directly (it needs a live MediaStream), and a hand-rolled WAV writer is simpler
 *  and more deterministic than routing the rendered buffer back through a MediaStreamDestination
 *  and a second real-time recording pass. */
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
