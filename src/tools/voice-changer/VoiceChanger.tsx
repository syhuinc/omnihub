import { useState } from 'react';
import { useRouter } from '../../app/Router';
import { useBackHandler } from '../../app/useBackHandler';
import type { VcApi, VcScreenName } from './types';
import type { SavedClip } from './clipStorage';
import { HomeScreen } from './screens/HomeScreen';
import { RecordScreen } from './screens/RecordScreen';
import { EffectsScreen } from './screens/EffectsScreen';
import { AutoTuneScreen } from './screens/AutoTuneScreen';
import { PitchSpeedScreen } from './screens/PitchSpeedScreen';
import { EchoReverbScreen } from './screens/EchoReverbScreen';
import { MixerScreen } from './screens/MixerScreen';
import { PreviewScreen } from './screens/PreviewScreen';
import { ShareScreen } from './screens/ShareScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import './VoiceChanger.css';

export function VoiceChanger() {
  const { back: exitTool } = useRouter();
  const [stack, setStack] = useState<VcScreenName[]>(['home']);
  const [original, setOriginalState] = useState<AudioBuffer | null>(null);
  const [processed, setProcessed] = useState<AudioBuffer | null>(null);
  const [processedLabel, setProcessedLabel] = useState('Original');
  const [pendingScreen, setPendingScreen] = useState<VcScreenName | null>(null);
  const [shareClip, setShareClip] = useState<SavedClip | null>(null);
  const [refreshHistoryToken, setRefreshHistoryToken] = useState(0);

  const screen = stack[stack.length - 1];

  function goto(next: VcScreenName) {
    setStack((s) => [...s, next]);
  }

  function replace(next: VcScreenName) {
    setStack((s) => [...s.slice(0, -1), next]);
  }

  function popBack() {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    if (stack.length <= 1) exitTool();
  }

  useBackHandler(popBack, screen !== 'home');

  function setOriginal(buffer: AudioBuffer) {
    setOriginalState(buffer);
    setProcessed(buffer);
    setProcessedLabel('Original');
  }

  function setResult(buffer: AudioBuffer, label: string) {
    setProcessed(buffer);
    setProcessedLabel(label);
  }

  const api: VcApi = {
    original,
    setOriginal,
    processed,
    processedLabel,
    setResult,
    goto,
    replace,
    popBack,
    pendingScreen,
    setPendingScreen,
    shareClip,
    setShareClip,
    refreshHistoryToken,
    bumpHistoryToken: () => setRefreshHistoryToken((t) => t + 1),
  };

  switch (screen) {
    case 'record':
      return <RecordScreen api={api} />;
    case 'effects':
      return <EffectsScreen api={api} />;
    case 'autotune':
      return <AutoTuneScreen api={api} />;
    case 'pitch-speed':
      return <PitchSpeedScreen api={api} />;
    case 'echo-reverb':
      return <EchoReverbScreen api={api} />;
    case 'mixer':
      return <MixerScreen api={api} />;
    case 'preview':
      return <PreviewScreen api={api} />;
    case 'share':
      return <ShareScreen api={api} />;
    case 'history':
      return <HistoryScreen api={api} />;
    case 'home':
    default:
      return <HomeScreen api={api} />;
  }
}
