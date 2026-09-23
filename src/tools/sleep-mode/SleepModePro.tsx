import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import './SleepMode.css';

interface SleepModeProProps {
  onBack: () => void;
}

const PERKS: { icon: string; title: string; desc: string }[] = [
  { icon: 'activity', title: 'AI-generated reminders', desc: 'Different messages every time' },
  { icon: 'heart', title: 'Strict & Savage personalities', desc: 'Advanced AI personalities' },
  { icon: 'user', title: 'Personal AI mode', desc: 'Uses your information' },
  { icon: 'trending-up', title: 'Adaptive escalation', desc: 'Smarter, more effective reminders' },
  { icon: 'volume', title: 'Voice reminders', desc: 'AI-generated voice messages' },
  { icon: 'zap', title: 'Sleep insights', desc: 'Detailed sleep statistics' },
  { icon: 'moon', title: 'Wind-down mode', desc: 'Relaxing tools before bedtime' },
];

export function SleepModePro({ onBack }: SleepModeProProps) {
  return (
    <div className="screen">
      <ScreenHeader title="Sleep Mode Pro" subtitle="Take your sleep experience to the next level" onBack={onBack} />

      <div className="sm__body">
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

        <div className="smp__coming-soon">
          <Icon name="crown" size={28} className="smp__coming-soon-icon" />
          <h3>Sleep Mode Pro is on its way</h3>
          <p>
            Everything above needs a live AI connection and billing, neither of which exist yet.
            The free Sleep Mode you already have keeps working exactly as it does today.
          </p>
        </div>
      </div>
    </div>
  );
}
