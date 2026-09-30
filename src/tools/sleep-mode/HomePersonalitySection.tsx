import { useState, type CSSProperties } from 'react';
import { Icon } from '../../components/Icon';
import { hapticSelect, hapticTap } from '../../haptics';
import { SleepModePlugin, type SleepModeConfig, type SleepModeStatus, type SleepPersonality } from '../../sleep-mode/plugin';
import { PERSONALITY_META } from './types';

interface HomePersonalitySectionProps {
  config: SleepModeStatus;
  onPersist: (next: SleepModeConfig) => void;
}

const NORMAL_PERSONALITIES = PERSONALITY_META.filter((p) => p.tier === 'normal');

/** The free, selectable Gentle/Friendly picker, right on Sleep Mode's Home tab — the AI-tier
 *  personalities (locked, not built yet) live in the AI tab instead. */
export function HomePersonalitySection({ config, onPersist }: HomePersonalitySectionProps) {
  const [sampleText, setSampleText] = useState<string | null>(null);
  const [sampleAvatarId, setSampleAvatarId] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const samplePersonality = PERSONALITY_META.find((p) => p.id === sampleAvatarId);
  const sampleAvatar = samplePersonality?.image;
  const sampleEmoji = samplePersonality?.emoji;

  function selectPersonality(id: SleepPersonality) {
    hapticSelect();
    onPersist({ ...config, personality: id });
  }

  async function hearSample() {
    hapticTap();
    setSampleAvatarId(config.personality);
    setBurstKey((k) => k + 1);

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
    <section className="sm__section">
      <h2>
        <Icon name="user" size={13} />
        Personality
      </h2>

      <div className="sm__personality-list">
        {NORMAL_PERSONALITIES.map((p) => {
          const active = config.personality === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={`sm__personality${active ? ' sm__personality--active' : ''}`}
              onClick={() => selectPersonality(p.id as SleepPersonality)}
            >
              <span className="sm__personality-emoji" style={{ '--emoji-color': p.color } as CSSProperties}>
                {p.image ? <img src={p.image} alt="" /> : <Icon name={(p.icon ?? 'user') as never} size={18} />}
              </span>
              <span className="sm__personality-info">
                <span className="sm__personality-label">{p.label}</span>
                <span className="sm__personality-desc">{p.description}</span>
              </span>
              <span className="sm__radio" aria-hidden="true" />
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
            <img src={sampleAvatar} alt="" />
            {sampleEmoji && (
              <span key={burstKey} className="sm__sample-emoji-burst" aria-hidden="true">
                {sampleEmoji}
              </span>
            )}
          </span>
          <p className="sm__sample-text">{sampleText}</p>
          <span className="sm__sample-wave" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      )}
    </section>
  );
}
