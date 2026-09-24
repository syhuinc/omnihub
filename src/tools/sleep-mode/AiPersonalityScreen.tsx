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

type Tier = 'normal' | 'ai';

export function AiPersonalityScreen({ config, onBack, onPersist }: AiPersonalityScreenProps) {
  const currentMeta = PERSONALITY_META.find((p) => p.id === config.personality);
  const [tab, setTab] = useState<Tier>(currentMeta?.tier === 'ai' ? 'ai' : 'normal');
  const [sampleText, setSampleText] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [comingSoonId, setComingSoonId] = useState<string | null>(null);

  function selectTab(next: Tier) {
    hapticSelect();
    setTab(next);
    setComingSoonId(null);
  }

  function selectPersonality(id: SleepPersonality | 'custom', tier: Tier) {
    hapticSelect();
    if (tier === 'ai') {
      setComingSoonId(id);
      return;
    }
    setComingSoonId(null);
    onPersist({ ...config, personality: id as SleepPersonality });
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

  const visible = PERSONALITY_META.filter((p) => p.tier === tab);

  return (
    <div className="screen">
      <ScreenHeader title="AI Personalities" subtitle="Choose how your Sleep Mode AI talks to you" onBack={onBack} />

      <div className="sm__body">
        <div className="si__range-tabs">
          <button
            type="button"
            className={`si__range-tab${tab === 'normal' ? ' si__range-tab--active' : ''}`}
            onClick={() => selectTab('normal')}
          >
            Normal
          </button>
          <button
            type="button"
            className={`si__range-tab${tab === 'ai' ? ' si__range-tab--active' : ''}`}
            onClick={() => selectTab('ai')}
          >
            AI
          </button>
        </div>

        {tab === 'ai' && (
          <p className="sm__pro-note">
            Sleep Mode AI isn't built yet, so these are locked — you can see what's coming, but
            they're not selectable until the AI backend is ready.
          </p>
        )}

        <div className="sm__personality-list">
          {visible.map((p) => {
            const locked = p.tier === 'ai';
            return (
              <button
                key={p.id}
                type="button"
                className={`sm__personality${config.personality === p.id ? ' sm__personality--active' : ''}${locked ? ' sm__personality--locked' : ''}`}
                onClick={() => selectPersonality(p.id, p.tier)}
              >
                <span className="sm__personality-emoji" style={{ '--emoji-color': p.color } as CSSProperties}>
                  {p.image ? <img src={p.image} alt="" /> : <Icon name={(p.icon ?? 'user') as never} size={18} />}
                </span>
                <span className="sm__personality-info">
                  <span className="sm__personality-label-row">
                    <span className="sm__personality-label">{p.label}</span>
                    <span className={`sm__badge${locked ? ' sm__badge--ai' : ' sm__badge--free'}`}>
                      {locked ? 'AI' : 'Free'}
                    </span>
                  </span>
                  <span className="sm__personality-desc">{p.description}</span>
                  {comingSoonId === p.id && <span className="sm__personality-soon">Coming soon — not built yet</span>}
                </span>
                {locked ? (
                  <Icon name="lock" size={16} className="sm__time-chevron" />
                ) : (
                  <span className="sm__radio" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        <button type="button" className="sm__sample-btn" onClick={hearSample} disabled={sampleLoading}>
          <Icon name="activity" size={16} />
          <span className="sm__sample-btn-text">
            {sampleLoading ? 'Loading…' : 'Hear a sample'}
            <small>Preview your current personality</small>
          </span>
          <Icon name="chevron-right" size={14} />
        </button>
        {sampleText && (
          <div className="sm__sample-bubble">
            <span className="sm__sample-avatar">
              <img src={currentMeta?.image} alt="" />
            </span>
            <p className="sm__sample-text">{sampleText}</p>
            <span className="sm__sample-wave" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
