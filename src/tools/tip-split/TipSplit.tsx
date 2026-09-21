import { useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import './TipSplit.css';

const TIP_PRESETS = [10, 15, 18, 20, 25];

function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return '$0.00';
  return `$${amount.toFixed(2)}`;
}

export function TipSplit() {
  const { navigate } = useRouter();
  const [billText, setBillText] = useState('');
  const [tipPercent, setTipPercent] = useState(15);
  const [customTip, setCustomTip] = useState('');
  const [useCustomTip, setUseCustomTip] = useState(false);
  const [people, setPeople] = useState(1);

  const bill = parseFloat(billText) || 0;
  const effectiveTipPercent = useCustomTip ? parseFloat(customTip) || 0 : tipPercent;

  const { tipAmount, total, perPerson, tipPerPerson, totalPerPerson } = useMemo(() => {
    const tip = (bill * effectiveTipPercent) / 100;
    const grandTotal = bill + tip;
    return {
      tipAmount: tip,
      total: grandTotal,
      perPerson: grandTotal / people,
      tipPerPerson: tip / people,
      totalPerPerson: grandTotal / people,
    };
  }, [bill, effectiveTipPercent, people]);

  return (
    <div className="screen">
      <ScreenHeader title="Tip & Split Bill" onBack={() => navigate('/tools')} />

      <div className="ts__body">
        <div className="ts__field">
          <label className="ts__label">Bill Amount</label>
          <div className="ts__amount-row">
            <span className="ts__currency">$</span>
            <input
              className="ts__amount-input"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={billText}
              onChange={(e) => setBillText(e.target.value)}
            />
          </div>
        </div>

        <div className="ts__field">
          <label className="ts__label">Tip</label>
          <div className="ts__tip-row">
            {TIP_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className={`ts__tip-chip${!useCustomTip && tipPercent === p ? ' ts__tip-chip--active' : ''}`}
                onClick={() => {
                  setUseCustomTip(false);
                  setTipPercent(p);
                }}
              >
                {p}%
              </button>
            ))}
            <button
              type="button"
              className={`ts__tip-chip${useCustomTip ? ' ts__tip-chip--active' : ''}`}
              onClick={() => setUseCustomTip(true)}
            >
              Custom
            </button>
          </div>
          {useCustomTip && (
            <div className="ts__custom-tip-row">
              <input
                className="ts__custom-tip-input"
                type="number"
                inputMode="decimal"
                placeholder="Tip %"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                autoFocus
              />
              <span>%</span>
            </div>
          )}
        </div>

        <div className="ts__field">
          <label className="ts__label">Split Between</label>
          <div className="ts__people-row">
            <button
              type="button"
              className="ts__stepper-btn"
              onClick={() => setPeople((p) => Math.max(1, p - 1))}
              aria-label="Fewer people"
            >
              −
            </button>
            <span className="ts__people-count">
              <Icon name="user" size={18} />
              {people}
            </span>
            <button
              type="button"
              className="ts__stepper-btn"
              onClick={() => setPeople((p) => Math.min(50, p + 1))}
              aria-label="More people"
            >
              +
            </button>
          </div>
        </div>

        <div className="ts__result">
          <div className="ts__result-row">
            <span>Tip Amount</span>
            <span>{formatMoney(tipAmount)}</span>
          </div>
          <div className="ts__result-row">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
          {people > 1 && (
            <div className="ts__result-row ts__result-row--sub">
              <span>Tip / Person</span>
              <span>{formatMoney(tipPerPerson)}</span>
            </div>
          )}
          <div className="ts__result-row ts__result-row--highlight">
            <span>{people > 1 ? 'Total / Person' : 'You Pay'}</span>
            <span>{formatMoney(people > 1 ? totalPerPerson : perPerson)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
