import { useEffect, useRef, useState } from 'react';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { Icon } from '../../../components/Icon';
import { hapticTap } from '../../../haptics';
import { decodeBlob } from '../playback';
import type { VcApi } from '../types';

/** Keeps recordings (and later processing time — Auto-Tune's analysis is the slowest consumer)
 *  quick and the exported file small. */
const MAX_RECORD_MS = 30_000;

function formatSeconds(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RecordScreen({ api }: { api: VcApi }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const autoStopRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      stopStream();
      clearTimer();
      if (autoStopRef.current) window.clearTimeout(autoStopRef.current);
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
      recorder.onstop = () => void handleStopped();

      recorder.start();
      hapticTap();
      setIsRecording(true);
      setIsPaused(false);
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      timerRef.current = window.setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 100);
      autoStopRef.current = window.setTimeout(() => stopRecording(), MAX_RECORD_MS);
    } catch {
      setError("Couldn't access the microphone — check that Omni Hub has microphone permission.");
    }
  }

  function togglePause() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    hapticTap();
    if (isPaused) {
      recorder.resume();
      // Resuming shifts the "start" reference forward so elapsedMs keeps counting from where it
      // was frozen, rather than jumping to include the paused interval.
      startedAtRef.current = Date.now() - elapsedMs;
      timerRef.current = window.setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 100);
      // The max-duration cutoff is a cap on actual recorded content, not wall-clock session time —
      // without this, time spent paused would silently eat into it, auto-stopping a session with
      // less audio than MAX_RECORD_MS ever actually captured.
      autoStopRef.current = window.setTimeout(() => stopRecording(), MAX_RECORD_MS - elapsedMs);
    } else {
      recorder.pause();
      clearTimer();
      if (autoStopRef.current) {
        window.clearTimeout(autoStopRef.current);
        autoStopRef.current = null;
      }
    }
    setIsPaused((p) => !p);
  }

  function stopRecording() {
    clearTimer();
    if (autoStopRef.current) {
      window.clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    hapticTap();
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  }

  async function handleStopped() {
    stopStream();
    setIsBusy(true);
    try {
      const blob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
      const buffer = await decodeBlob(blob);
      api.setOriginal(buffer);
      const dest = api.pendingScreen ?? 'effects';
      api.setPendingScreen(null);
      api.replace(dest);
    } catch {
      setError("Couldn't process that recording — give it another try.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="screen">
      <ScreenHeader title="Recording" onBack={api.popBack} />
      <div className="vch__body vch__body--center">
        {error && (
          <div className="vch__error">
            <Icon name="info" size={16} />
            <span>{error}</span>
          </div>
        )}

        {!isRecording ? (
          <>
            <button type="button" className="vch__record-btn" onClick={() => void startRecording()} disabled={isBusy} aria-label="Start recording">
              <Icon name="mic" size={36} />
            </button>
            <p className="vch__hint">{isBusy ? 'Processing…' : 'Tap to start recording'}</p>
          </>
        ) : (
          <>
            <p className="vch__timer">
              {!isPaused && <span className="vch__rec-dot" />}
              {formatSeconds(elapsedMs)}
            </p>
            <div className="vch__pulse-wrap">
              {!isPaused && <span className="vch__pulse-ring" />}
              <button type="button" className="vch__record-btn vch__record-btn--active" onClick={stopRecording} aria-label="Stop recording">
                <Icon name="mic" size={36} />
              </button>
            </div>
            <p className="vch__hint">{isPaused ? 'Paused.' : 'Recording…'} Tap Stop when done</p>

            <div className="vch__actions">
              <button type="button" className="vch__action vch__action--secondary" onClick={togglePause}>
                <Icon name={isPaused ? 'play' : 'pause'} size={17} />
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button type="button" className="vch__action vch__action--danger" onClick={stopRecording}>
                <Icon name="stop" size={17} />
                Stop
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
