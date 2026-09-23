import { useState, type CSSProperties } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { hapticSelect, hapticTap } from '../../haptics';
import { SleepModePlugin, type SleepModeConfig, type SleepPersonality } from '../../sleep-mode/plugin';
import { PERSONALITY_META } from './types';
import './SleepMode.css';

interface AiPersonalityScreenProps {
  config: SleepModeConfig;
  onBack: () => void;
  onPersist: (next: SleepModeConfig) => void;
}

export function AiPersonalityScreen({ config, onBack, onPersist }: AiPersonalityScreenProps) {
  const [sampleText, setSampleText] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);

  function selectPersonality(id: SleepPersonality) {
    hapticSelect();
    onPersist({ ...config, personality: id });
  }

  async function hearSample() {
    hapticTap();
    setSampleLoading(true);
    try {
      const { text } = await SleepModePlugin.previewMessage({
        personality: config.personality,
        callName: config.mode === 'personal' ? config.callName : null,
        workSchoolRoutine: config.mode === 'personal' ? config.workSchoolRoutine : null,
      });
      setSampleText(text);
      await SleepModePlugin.speakTest({ text });
    } catch {
      // web fallback / unsupported platform — nothing more we can do
    } finally {
      setSampleLoading(false);
    }
  }

  return (
    <div className="screen">
      <ScreenHeader title="AI Personality" subtitle="Choose how you want to be reminded" onBack={onBack} />

      <div className="sm__body">
        <div className="sm__personality-list">
          {PERSONALITY_META.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`sm__personality${config.personality === p.id ? ' sm__personality--active' : ''}`}
              onClick={() => selectPersonality(p.id)}
            >
              <span className="sm__personality-emoji" style={{ '--emoji-color': p.color } as CSSProperties}>
                <img src={p.image} alt="" />
              </span>
              <span className="sm__personality-info">
                <span className="sm__personality-label-row">
                  <span className="sm__personality-label">{p.label}</span>
                  <span className={`sm__badge${p.pro ? ' sm__badge--pro' : ' sm__badge--free'}`}>
                    {p.pro ? 'PRO' : 'Free'}
                  </span>
                </span>
                <span className="sm__personality-desc">{p.description}</span>
              </span>
              <span className="sm__radio" aria-hidden="true" />
            </button>
          ))}
        </div>

        <button type="button" className="sm__sample-btn" onClick={hearSample} disabled={sampleLoading}>
          <Icon name="activity" size={16} />
          <span className="sm__sample-btn-text">
            {sampleLoading ? 'Loading…' : 'Hear a sample'}
            <small>Preview how each personality sounds</small>
          </span>
          <Icon name="chevron-right" size={14} />
        </button>
        {sampleText && (
          <div className="sm__sample-bubble">
            <span className="sm__sample-avatar">
              <img src={PERSONALITY_META.find((p) => p.id === config.personality)?.image} alt="" />
            </span>
            <p className="sm__sample-text">{sampleText}</p>
            <span className="sm__sample-wave" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>
        )}

        <p className="sm__pro-note">
          Strict and Savage are marked Pro to match what's coming, but they work today — Sleep Mode
          Pro billing isn't live yet, so nothing here is actually locked.
        </p>
      </div>
    </div>
  );
}
