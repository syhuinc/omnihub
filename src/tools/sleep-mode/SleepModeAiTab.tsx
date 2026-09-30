import { useRef, useState, type CSSProperties } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { hapticTap } from '../../haptics';
import { PERSONALITY_META } from './types';
import { SAMPLE_AUDIO } from '../../assets/sleep-mode';
import './SleepMode.css';

const PERKS: { icon: string; title: string; desc: string }[] = [
  { icon: 'activity', title: 'AI-generated reminders', desc: 'Different message every time' },
  { icon: 'heart', title: 'Personal mode', desc: 'Uses your information for more relevant messages' },
  { icon: 'trending-up', title: 'Adaptive escalation', desc: 'Gets stronger if you ignore reminders' },
  { icon: 'volume', title: 'AI voice reminders', desc: 'Let AI read reminders out loud' },
  { icon: 'zap', title: 'AI sleep insights', desc: 'Detailed AI-powered analysis' },
  { icon: 'palette', title: 'Custom AI personality', desc: 'Create your own AI style' },
];

interface SleepModeAiTabProps {
  onBack: () => void;
  onOpenChat: () => void;
}

/** Sleep Mode's "AI" tab: preview every personality's AI-voiced take (all locked — the AI
 *  backend doesn't exist yet) plus what's planned once it does. Gentle/Friendly's real,
 *  functional picker lives on the Home tab instead. */
export function SleepModeAiTab({ onBack, onOpenChat }: SleepModeAiTabProps) {
  const [sampleText, setSampleText] = useState<string | null>(null);
  const [sampleAvatarId, setSampleAvatarId] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const comingSoonRef = useRef<HTMLDivElement>(null);

  const samplePersonality = PERSONALITY_META.find((p) => p.id === sampleAvatarId);
  const sampleAvatar = samplePersonality?.image;
  const sampleEmoji = samplePersonality?.emoji;

  async function previewPersonality(id: string) {
    hapticTap();
    const recorded = SAMPLE_AUDIO[id];
    setSampleAvatarId(id);
    setBurstKey((k) => k + 1);
    if (!recorded) {
      setSampleText(null);
      return;
    }
    setSampleText(recorded.text);
    setSampleLoading(true);
    const audio = new Audio(recorded.audio);
    audio.onended = () => setSampleLoading(false);
    audio.onerror = () => setSampleLoading(false);
    try {
      await audio.play();
    } catch {
      setSampleLoading(false);
    }
  }

  function scrollToComingSoon() {
    hapticTap();
    comingSoonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="AI Personality"
        subtitle="What Sleep Mode AI will sound like, once it's built"
        onBack={onBack}
        action={<span className="sm__badge sm__badge--ai">AI</span>}
      />

      <div className="sm__body">
        <p className="sm__pro-note">
          Gentle is live — tap it to start chatting. The rest are still locked previews until they
          get their own AI backend.
        </p>

        <div className="sm__personality-list">
          {PERSONALITY_META.map((p) =>
            p.chatEnabled ? (
              <button key={p.id} type="button" className="sm__personality" onClick={onOpenChat}>
                <span className="sm__personality-emoji" style={{ '--emoji-color': p.color } as CSSProperties}>
                  {p.image ? <img src={p.image} alt="" /> : <Icon name={(p.icon ?? 'user') as never} size={18} />}
                </span>
                <span className="sm__personality-info">
                  <span className="sm__personality-label-row">
                    <span className="sm__personality-label">{p.label}</span>
                    <span className="sm__badge sm__badge--ai">AI</span>
                  </span>
                  <span className="sm__personality-desc">Chat now</span>
                </span>
                <Icon name="chat" size={16} className="sm__time-chevron" />
              </button>
            ) : (
              <button
                key={p.id}
                type="button"
                className="sm__personality sm__personality--locked"
                onClick={() => previewPersonality(p.id)}
              >
                <span className="sm__personality-emoji" style={{ '--emoji-color': p.color } as CSSProperties}>
                  {p.image ? <img src={p.image} alt="" /> : <Icon name={(p.icon ?? 'user') as never} size={18} />}
                </span>
                <span className="sm__personality-info">
                  <span className="sm__personality-label-row">
                    <span className="sm__personality-label">{p.label}</span>
                    <span className="sm__badge sm__badge--ai">AI</span>
                  </span>
                  <span className="sm__personality-desc">{p.description}</span>
                </span>
                <Icon name="lock" size={16} className="sm__time-chevron" />
              </button>
            ),
          )}
        </div>

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
            <p className="sm__sample-text">{sampleLoading ? 'Loading…' : sampleText}</p>
            <span className="sm__sample-wave" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>
        )}

        <button type="button" className="smp__upgrade-btn" onClick={scrollToComingSoon}>
          <Icon name="activity" size={16} />
          See What's Coming
          <Icon name="chevron-right" size={14} />
        </button>

        <ul className="smp__perks">
          {PERKS.map((p) => (
            <li key={p.title} className="smp__perk">
              <span className="smp__perk-icon">
                <Icon name={p.icon as never} size={17} />
              </span>
              <span className="smp__perk-text">
                <strong>{p.title}</strong>
                <span>{p.desc}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="smp__coming-soon" ref={comingSoonRef}>
          <Icon name="crown" size={28} className="smp__coming-soon-icon" />
          <h3>Sleep Mode AI is on its way</h3>
          <p>
            Everything above needs a live AI connection and billing, neither of which exist yet.
            The free Sleep Mode you already have keeps working exactly as it does today.
          </p>
        </div>
      </div>
    </div>
  );
}
