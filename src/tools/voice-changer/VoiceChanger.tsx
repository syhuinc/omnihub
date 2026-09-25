import { useEffect, useRef, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { hapticTap, hapticSelect, hapticSuccess, hapticWarning } from '../../haptics';
import { VOICE_EFFECTS, renderEffect, audioBufferToWav, type VoiceEffectId } from './audioEffects';
import './VoiceChanger.css';

type Stage = 'idle' | 'recording' | 'ready';

/** Keeps recordings (and the WAV export/share payload) small and quick to process. */
const MAX_RECORD_MS = 30_000;

function formatSeconds(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VoiceChanger() {
  const { back } = useRouter();
  const [stage, setStage] = useState<Stage>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<VoiceEffectId>('original');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const originalBufferRef = useRef<AudioBuffer | null>(null);
  const renderedCacheRef = useRef<Map<VoiceEffectId, AudioBuffer>>(new Map());
  const playCtxRef = useRef<AudioContext | null>(null);
  const playSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const autoStopRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      stopStream();
      clearTimer();
      if (autoStopRef.current) window.clearTimeout(autoStopRef.current);
      stopPlayback();
    },
    [],
  );

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function clearTimer() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function stopPlayback() {
    if (playSourceRef.current) {
      try {
        playSourceRef.current.stop();
      } catch {
        // already stopped — ignore
      }
      playSourceRef.current = null;
    }
    setIsPlaying(false);
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => void handleRecordingStopped();

      recorder.start();
      hapticTap();
      setStage('recording');
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      timerRef.current = window.setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 100);
      autoStopRef.current = window.setTimeout(() => stopRecording(), MAX_RECORD_MS);
    } catch {
      setError("Couldn't access the microphone — check that Omni Hub has microphone permission.");
    }
  }

  function stopRecording() {
    clearTimer();
    if (autoStopRef.current) {
      window.clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    hapticTap();
    mediaRecorderRef.current?.stop();
  }

  async function handleRecordingStopped() {
    stopStream();
    setIsBusy(true);
    try {
      const blob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
      const arrayBuffer = await blob.arrayBuffer();
      const ctx = getPlayContext();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      originalBufferRef.current = decoded;
      renderedCacheRef.current = new Map([['original', decoded]]);
      setSelectedEffect('original');
      setStage('ready');
    } catch {
      setError("Couldn't process that recording — give it another try.");
      setStage('idle');
    } finally {
      setIsBusy(false);
    }
  }

  function getPlayContext(): AudioContext {
    if (!playCtxRef.current) playCtxRef.current = new AudioContext();
    return playCtxRef.current;
  }

  async function getRenderedBuffer(effect: VoiceEffectId): Promise<AudioBuffer | null> {
    const original = originalBufferRef.current;
    if (!original) return null;
    const cached = renderedCacheRef.current.get(effect);
    if (cached) return cached;
    const rendered = await renderEffect(original, effect);
    renderedCacheRef.current.set(effect, rendered);
    return rendered;
  }

  async function selectEffect(effect: VoiceEffectId) {
    hapticSelect();
    setSelectedEffect(effect);
    await playEffect(effect);
  }

  async function playEffect(effect: VoiceEffectId) {
    stopPlayback();
    setIsBusy(true);
    try {
      const buffer = await getRenderedBuffer(effect);
      if (!buffer) return;
      const ctx = getPlayContext();
      if (ctx.state === 'suspended') await ctx.resume();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      playSourceRef.current = source;
      setIsPlaying(true);
    } catch {
      setError("Couldn't play that back — try again.");
    } finally {
      setIsBusy(false);
    }
  }

  function handlePlayTap() {
    if (isPlaying) {
      stopPlayback();
    } else {
      void playEffect(selectedEffect);
    }
  }

  async function handleShare() {
    setIsBusy(true);
    try {
      const buffer = await getRenderedBuffer(selectedEffect);
      if (!buffer) return;
      const wav = audioBufferToWav(buffer);
      const effectLabel = VOICE_EFFECTS.find((e) => e.id === selectedEffect)?.label ?? 'voice';
      const filename = `omni-hub-${effectLabel.toLowerCase().replace(/\s+/g, '-')}.wav`;
      const file = new File([wav], filename, { type: 'audio/wav' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Voice Changer' });
        hapticSuccess();
      } else {
        const url = URL.createObjectURL(wav);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        hapticSuccess();
      }
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') {
        hapticWarning();
        setError("Couldn't share that clip — try again.");
      }
    } finally {
      setIsBusy(false);
    }
  }

  function handleReRecord() {
    hapticTap();
    stopPlayback();
    originalBufferRef.current = null;
    renderedCacheRef.current = new Map();
    setSelectedEffect('original');
    setError(null);
    setStage('idle');
  }

  return (
    <div className="screen">
      <ScreenHeader title="Voice Changer" subtitle="Record, transform, share" onBack={back} />

      <div className="vch__body">
        {error && (
          <div className="vch__error">
            <Icon name="info" size={16} />
            <span>{error}</span>
          </div>
        )}

        {stage === 'idle' && (
          <div className="vch__stage vch__stage--idle">
            <button type="button" className="vch__record-btn" onClick={() => void startRecording()} aria-label="Start recording">
              <Icon name="mic" size={36} />
            </button>
            <p className="vch__hint">Tap to record your voice</p>
          </div>
        )}

        {stage === 'recording' && (
          <div className="vch__stage vch__stage--recording">
            <div className="vch__pulse-wrap">
              <span className="vch__pulse-ring" />
              <button type="button" className="vch__record-btn vch__record-btn--active" onClick={stopRecording} aria-label="Stop recording">
                <Icon name="stop" size={30} />
              </button>
            </div>
            <p className="vch__timer">{formatSeconds(elapsedMs)}</p>
            <p className="vch__hint">Recording… tap to stop</p>
          </div>
        )}

        {stage === 'ready' && (
          <div className="vch__stage vch__stage--ready">
            <button type="button" className="vch__play-btn" onClick={handlePlayTap} disabled={isBusy} aria-label={isPlaying ? 'Stop' : 'Play'}>
              <Icon name={isPlaying ? 'stop' : 'play'} size={30} />
            </button>

            <div className="vch__effects">
              {VOICE_EFFECTS.map((effect) => (
                <button
                  key={effect.id}
                  type="button"
                  className={`vch__effect${selectedEffect === effect.id ? ' vch__effect--active' : ''}`}
                  onClick={() => void selectEffect(effect.id)}
                  disabled={isBusy}
                >
                  <span className="vch__effect-icon">
                    <Icon name={effect.icon} size={20} />
                  </span>
                  <span>{effect.label}</span>
                </button>
              ))}
            </div>

            <div className="vch__actions">
              <button type="button" className="vch__action vch__action--secondary" onClick={handleReRecord}>
                <Icon name="mic" size={17} />
                Re-record
              </button>
              <button type="button" className="vch__action vch__action--primary" onClick={() => void handleShare()} disabled={isBusy}>
                <Icon name="share" size={17} />
                Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
