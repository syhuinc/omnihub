import { useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { hapticSelect, hapticTap } from '../../haptics';
import { useBackHandler } from '../../app/useBackHandler';
import type { ExpenseCategory } from '../expense-tracker/categories';
import type { BudgetLimit } from './types';
import './SetBudget.css';

import { currencySymbol, formatMoney } from '../shared/currencies';

const PRESETS = [50, 100, 200, 500];
const THRESHOLDS = [50, 80, 100];

interface SetBudgetProps {
  category: ExpenseCategory;
  budget: BudgetLimit | undefined;
  currency: string;
  monthLabel: string;
  spent: number;
  onSave: (patch: { amount: number; alertEnabled: boolean; alertThresholdPct: number }) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function SetBudget({ category, budget, currency, monthLabel, spent, onSave, onDelete, onClose }: SetBudgetProps) {
  const [amountText, setAmountText] = useState(budget ? String(budget.amount) : '');
  const [alertEnabled, setAlertEnabled] = useState(budget?.alertEnabled ?? true);
  const [threshold, setThreshold] = useState(budget?.alertThresholdPct ?? 80);

  useBackHandler(onClose, true);

  const amount = parseFloat(amountText) || 0;
  const pct = amount > 0 ? Math.min(100, (spent / amount) * 100) : 0;
  const status = amount === 0 ? null : spent > amount ? 'over' : pct >= threshold ? 'near' : 'ok';

  function handleSave() {
    hapticTap();
    onSave({ amount, alertEnabled, alertThresholdPct: threshold });
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="Set Budget"
        subtitle={category.label}
        onBack={onClose}
        action={
          budget && (
            <button type="button" className="sb__icon-btn" onClick={onDelete} aria-label="Remove budget">
              <Icon name="trash" size={18} />
            </button>
          )
        }
      />

      <div className="sb__body">
        <div className="sb__category-row">
          <span className="sb__category-icon" style={{ '--cat-color': category.color } as React.CSSProperties}>
            <Icon name={category.icon} size={22} />
          </span>
          <div>
            <strong>{category.label}</strong>
            <span>Set your monthly budget limit</span>
          </div>
        </div>

        <h2 className="sb__label">Monthly Budget</h2>
        <div className="sb__amount-row">
          <span className="sb__currency">{currencySymbol(currency)}</span>
          <input
            className="sb__amount-input"
            type="number"
            inputMode="decimal"
            value={amountText}
            placeholder="0.00"
            onChange={(e) => setAmountText(e.target.value)}
          />
          {amountText && (
            <button type="button" className="sb__amount-clear" onClick={() => setAmountText('')} aria-label="Clear">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
        <div className="sb__preset-row">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`sb__preset-chip${amount === p ? ' sb__preset-chip--active' : ''}`}
              onClick={() => {
                hapticSelect();
                setAmountText(String(p));
              }}
            >
              {currencySymbol(currency)}{p}
            </button>
          ))}
        </div>

        <h2 className="sb__label">Budget Period</h2>
        <div className="sb__period-row">
          <Icon name="calendar" size={16} />
          {monthLabel}
        </div>

        <div className="sb__alert-row">
          <span className="sb__alert-icon">
            <Icon name="bell" size={18} />
          </span>
          <div className="sb__alert-text">
            <strong>Spending Alert</strong>
            <span>Highlight this category once spending crosses the threshold</span>
          </div>
          <button
            type="button"
            className={`sb__switch${alertEnabled ? ' sb__switch--on' : ''}`}
            onClick={() => {
              hapticSelect();
              setAlertEnabled((v) => !v);
            }}
            role="switch"
            aria-checked={alertEnabled}
            aria-label="Toggle spending alert"
          >
            <span className="sb__switch-knob" />
          </button>
        </div>
        {alertEnabled && (
          <div className="sb__threshold-row">
            {THRESHOLDS.map((t) => (
              <button
                key={t}
                type="button"
                className={`sb__threshold-chip${threshold === t ? ' sb__threshold-chip--active' : ''}`}
                onClick={() => {
                  hapticSelect();
                  setThreshold(t);
                }}
              >
                {t}%
              </button>
            ))}
          </div>
        )}

        <div className="sb__preview">
          <div className="sb__preview-header">
            <strong>Preview</strong>
            <span>Based on current spending</span>
          </div>
          <div className="sb__preview-stats">
            <div className="sb__preview-stat">
              <span>Budget</span>
              <strong>{formatMoney(amount, currency)}</strong>
            </div>
            <div className="sb__preview-stat sb__preview-stat--status">
              <span>Projected Status</span>
              <strong className={`sb__status sb__status--${status ?? 'ok'}`}>
                <Icon name={status === 'over' ? 'x' : status === 'near' ? 'info' : 'check'} size={14} />
                {status === 'over' ? 'Over Budget' : status === 'near' ? 'Near Limit' : 'On Track'}
              </strong>
            </div>
          </div>
          <div className="sb__preview-track">
            <div className={`sb__preview-bar sb__preview-bar--${status ?? 'ok'}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="sb__preview-scale">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <button type="button" className="sb__save" onClick={handleSave} disabled={amount <= 0}>
          <Icon name="check" size={18} strokeWidth={3} />
          Save Budget
        </button>
      </div>
    </div>
  );
}
