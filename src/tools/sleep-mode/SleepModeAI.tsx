import { useRef } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { hapticTap } from '../../haptics';
import { PERSONALITY_IMAGES } from '../../assets/sleep-mode';
import './SleepMode.css';

interface SleepModeAIProps {
  onBack: () => void;
}

const PERKS: { icon: string; title: string; desc: string }[] = [
  { icon: 'activity', title: 'AI-generated reminders', desc: 'Different message every time' },
  { icon: 'user', title: '5 AI personalities', desc: 'Gentle, Friendly, Teasing, Strict and Savage' },
  { icon: 'heart', title: 'Personal mode', desc: 'Uses your information for more relevant messages' },
  { icon: 'trending-up', title: 'Adaptive escalation', desc: 'Gets stronger if you ignore reminders' },
  { icon: 'volume', title: 'AI voice reminders', desc: 'Let AI read reminders out loud' },
  { icon: 'zap', title: 'AI sleep insights', desc: 'Detailed AI-powered analysis' },
  { icon: 'palette', title: 'Custom AI personality', desc: 'Create your own AI style' },
];

export function SleepModeAI({ onBack }: SleepModeAIProps) {
  const comingSoonRef = useRef<HTMLDivElement>(null);

  function scrollToComingSoon() {
    hapticTap();
    comingSoonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="Sleep Mode AI"
        subtitle="Upgrade to get AI-powered bedtime reminders with unique messages"
        onBack={onBack}
        action={<span className="sm__badge sm__badge--pro">PRO</span>}
      />

      <div className="sm__body">
        <div className="sm__sample-bubble">
          <span className="sm__sample-avatar">
            <img src={PERSONALITY_IMAGES.gentle} alt="" />
          </span>
          <p className="sm__sample-text">Hey, it's getting late. Your pillow is waiting. Let's get some sleep! 😴</p>
        </div>

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

        <button type="button" className="smp__upgrade-btn" onClick={scrollToComingSoon}>
          <Icon name="crown" size={16} />
          Upgrade to Pro
          <Icon name="chevron-right" size={14} />
        </button>

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
