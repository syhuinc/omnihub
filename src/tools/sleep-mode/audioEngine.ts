/**
 * Looping ambient audio for Sleep Sounds — real 60s recordings bundled with the app, decoded once
 * per sound and looped via the Web Audio API.
 */
import { SOUND_AUDIO } from '../../assets/sleep-mode';

type SoundId = 'rain' | 'forest' | 'ocean' | 'night-ambience' | 'campfire' | 'cafe';

interface ActiveSound {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

let audioCtx: AudioContext | null = null;
let active: ActiveSound | null = null;
let activeId: SoundId | null = null;
let loadToken = 0;
const bufferCache: Partial<Record<SoundId, AudioBuffer>> = {};

function getContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

async function getBuffer(ctx: AudioContext, id: SoundId): Promise<AudioBuffer> {
  const cached = bufferCache[id];
  if (cached) return cached;
  const res = await fetch(SOUND_AUDIO[id]);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = await ctx.decodeAudioData(arrayBuffer);
  bufferCache[id] = buffer;
  return buffer;
}

export async function playSound(id: SoundId, volume: number): Promise<void> {
  stopSound();
  const token = ++loadToken;
  const ctx = getContext();
  if (ctx.state === 'suspended') await ctx.resume();

  const buffer = await getBuffer(ctx, id);
  if (token !== loadToken) return; // superseded by a newer play/stop call while loading

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  active = { source, gain };
  activeId = id;
}

export function setVolume(volume: number): void {
  if (active) active.gain.gain.value = volume;
}

export function stopSound(): void {
  loadToken++;
  if (active) {
    try {
      active.source.stop();
    } catch {
      // already stopped — ignore
    }
    active.source.disconnect();
    active.gain.disconnect();
    active = null;
    activeId = null;
  }
}

export function getActiveSoundId(): SoundId | null {
  return activeId;
}
