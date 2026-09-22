import { useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useRouter } from '../../app/Router';
import './PercentageCalculator.css';

type Mode = 'of' | 'isWhatPercent' | 'change';

const MODES: { id: Mode; label: string }[] = [
  { id: 'of', label: 'X% of Y' },
  { id: 'isWhatPercent', label: 'X is what % of Y' },
  { id: 'change', label: '% Change' },
];

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function PercentageCalculator() {
  const { back } = useRouter();
  const [mode, setMode] = useState<Mode>('of');
  const [aText, setAText] = useState('');
  const [bText, setBText] = useState('');

  const a = parseFloat(aText);
  const b = parseFloat(bText);

  const result = useMemo(() => {
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    if (mode === 'of') return (a / 100) * b;
    if (mode === 'isWhatPercent') return b === 0 ? null : (a / b) * 100;
    if (b === 0) return null;
    return ((b - a) / a) * 100;
  }, [mode, a, b]);

  const labels =
    mode === 'of'
      ? { a: 'Percent (%)', b: 'Of value' }
      : mode === 'isWhatPercent'
        ? { a: 'This value', b: 'Is what % of this' }
        : { a: 'From value', b: 'To value' };

  const resultLabel =
    mode === 'of' ? 'Result' : mode === 'isWhatPercent' ? 'Percentage' : 'Change';

  return (
    <div className="screen">
      <ScreenHeader title="Percentage Calculator" onBack={back} />

      <div className="pc__body">
        <div className="pc__mode-row">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`pc__mode-chip${mode === m.id ? ' pc__mode-chip--active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="pc__field">
          <label className="pc__label">{labels.a}</label>
          <input
            className="pc__input"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={aText}
            onChange={(e) => setAText(e.target.value)}
            autoFocus
          />
        </div>

        <div className="pc__field">
          <label className="pc__label">{labels.b}</label>
          <input
            className="pc__input"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={bText}
            onChange={(e) => setBText(e.target.value)}
          />
        </div>

        <div className="pc__result">
          <span className="pc__result-label">{resultLabel}</span>
          <span className="pc__result-value">
            {result === null ? '—' : mode === 'of' ? formatNumber(result) : `${formatNumber(result)}%`}
          </span>
        </div>
      </div>
    </div>
  );
}
