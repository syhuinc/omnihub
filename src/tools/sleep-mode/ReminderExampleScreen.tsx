import { useEffect, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SleepModePlugin } from '../../sleep-mode/plugin';
import type { SleepPersonality } from '../../sleep-mode/plugin';
import { PERSONALITY_META, type PersonalityMeta } from './types';
import './SleepMode.css';

interface ReminderExampleScreenProps {
  onBack: () => void;
}

interface ExampleRow {
  personality: PersonalityMeta;
  text: string;
  time: string;
}

// Illustrative escalation, not a real log — Sleep Insights is where genuinely logged data lives.
const EXAMPLE_TIMES = ['12:00 AM', '12:15 AM', '12:30 AM', '12:30 AM', '1:00 AM'];

// "Custom" isn't a real personality yet, so it has no messages to preview.
const REAL_PERSONALITIES = PERSONALITY_META.filter((p) => !p.comingSoon);

export function ReminderExampleScreen({ onBack }: ReminderExampleScreenProps) {
  const [rows, setRows] = useState<ExampleRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      REAL_PERSONALITIES.map(async (p, i) => {
        try {
          const { text } = await SleepModePlugin.previewMessage({
            personality: p.id as SleepPersonality,
            tier: Math.min(i, 3),
          });
          return { personality: p, text, time: EXAMPLE_TIMES[i] };
        } catch {
          return { personality: p, text: '', time: EXAMPLE_TIMES[i] };
        }
      }),
    ).then((result) => {
      if (!cancelled) setRows(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="screen">
      <ScreenHeader title="Reminder Example" subtitle="Different messages every time" onBack={onBack} />

      <div className="sm__body">
        <p className="sm__pro-note">
          These are examples of how each personality escalates over a night, not a real log of
          messages sent to you — check Sleep Insights for your actual usage.
        </p>

        <div className="sm__example-list">
          {(rows ?? []).map((row) => (
            <div key={row.personality.id} className="sm__example-row">
              <span
                className="sm__personality-emoji"
                style={{ '--emoji-color': row.personality.color } as never}
              >
                <img src={row.personality.image ?? ''} alt="" />
              </span>
              <div className="sm__example-body">
                <div className="sm__example-head">
                  <strong>{row.personality.label}</strong>
                  <span className={`sm__badge${row.personality.pro ? ' sm__badge--pro' : ' sm__badge--free'}`}>
                    {row.personality.pro ? 'PRO' : 'Free'}
                  </span>
                  <span className="sm__example-time">{row.time}</span>
                </div>
                <p className="sm__example-text">{row.text || '…'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
