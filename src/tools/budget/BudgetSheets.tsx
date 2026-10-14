import { useState, type ReactNode } from 'react';
import { Icon } from '../../components/Icon';
import { useBackHandler } from '../../app/useBackHandler';
import { hapticSelect, hapticTap } from '../../haptics';
import { CURRENCIES, currencySymbol, formatMoney } from '../shared/currencies';
import { GOAL_ART } from './budgetArt';
import type { GoalIcon, SavingsGoal } from './budgetStore';

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useBackHandler(onClose, true);
  return (
    <div className="bd__sheet-overlay" onClick={onClose}>
      <div className="bd__sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bd__sheet-grip" />
        <h3 className="bd__sheet-title">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function AmountInput({ value, onChange, currency, autoFocus }: { value: string; onChange: (v: string) => void; currency: string; autoFocus?: boolean }) {
  return (
    <label className="bd__amount">
      <span>{currencySymbol(currency)}</span>
      <input
        inputMode="decimal"
        placeholder="0.00"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
      />
    </label>
  );
}

const parse = (v: string) => Math.max(0, Math.round((parseFloat(v) || 0) * 100) / 100);

export function AmountSheet({
  title,
  hint,
  initial,
  currency,
  confirmLabel = 'Save',
  onSave,
  onClose,
}: {
  title: string;
  hint?: string;
  initial: number;
  currency: string;
  confirmLabel?: string;
  onSave: (amount: number) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initial > 0 ? String(initial) : '');
  return (
    <Sheet title={title} onClose={onClose}>
      {hint && <p className="bd__sheet-hint">{hint}</p>}
      <AmountInput value={text} onChange={setText} currency={currency} autoFocus />
      <button type="button" className="bd__primary" onClick={() => { hapticTap(); onSave(parse(text)); }}>
        {confirmLabel}
      </button>
    </Sheet>
  );
}

export function AddSavingsSheet({
  goals,
  currency,
  initialGoalId,
  onSave,
  onClose,
}: {
  goals: SavingsGoal[];
  currency: string;
  initialGoalId: string | null;
  onSave: (amount: number, goalId: string | null) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [goalId, setGoalId] = useState<string | null>(initialGoalId);
  const amount = parse(text);
  return (
    <Sheet title="Add to Savings" onClose={onClose}>
      <AmountInput value={text} onChange={setText} currency={currency} autoFocus />
      {goals.length > 0 && (
        <>
          <p className="bd__sheet-label">Save towards</p>
          <div className="bd__chips">
            <button type="button" className={`bd__chip${goalId === null ? ' bd__chip--on' : ''}`} onClick={() => { hapticSelect(); setGoalId(null); }}>
              Savings account
            </button>
            {goals.map((g) => (
              <button key={g.id} type="button" className={`bd__chip${goalId === g.id ? ' bd__chip--on' : ''}`} onClick={() => { hapticSelect(); setGoalId(g.id); }}>
                {g.name}
              </button>
            ))}
          </div>
        </>
      )}
      <button type="button" className="bd__primary" disabled={amount <= 0} onClick={() => { hapticTap(); onSave(amount, goalId); }}>
        Add {amount > 0 ? formatMoney(amount, currency) : ''}
      </button>
    </Sheet>
  );
}

const ICON_CHOICES: GoalIcon[] = ['laptop', 'island', 'piggy', 'target', 'wallet', 'calendar', 'document', 'chart'];

export function GoalEditorSheet({
  currency,
  onSave,
  onClose,
}: {
  currency: string;
  onSave: (goal: { name: string; target: number; icon: GoalIcon }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [icon, setIcon] = useState<GoalIcon>('piggy');
  const target = parse(text);
  const valid = name.trim().length > 0 && target > 0;
  return (
    <Sheet title="New Savings Goal" onClose={onClose}>
      <input className="bd__text-input" placeholder="Goal name, e.g. New Laptop" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} autoFocus />
      <p className="bd__sheet-label">Target amount</p>
      <AmountInput value={text} onChange={setText} currency={currency} />
      <p className="bd__sheet-label">Icon</p>
      <div className="bd__icon-grid">
        {ICON_CHOICES.map((k) => (
          <button key={k} type="button" className={`bd__icon-choice${icon === k ? ' bd__icon-choice--on' : ''}`} onClick={() => { hapticSelect(); setIcon(k); }} aria-label={k}>
            <img src={GOAL_ART[k]} alt="" />
          </button>
        ))}
      </div>
      <button type="button" className="bd__primary" disabled={!valid} onClick={() => { hapticTap(); onSave({ name: name.trim(), target, icon }); }}>
        Create Goal
      </button>
    </Sheet>
  );
}

export function GoalSheet({
  goal,
  saved,
  currency,
  onAdd,
  onWithdraw,
  onDelete,
  onClose,
}: {
  goal: SavingsGoal;
  saved: number;
  currency: string;
  onAdd: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const amount = parse(text);
  const pct = goal.target > 0 ? Math.min(100, (saved / goal.target) * 100) : 0;
  return (
    <Sheet title={goal.name} onClose={onClose}>
      <div className="bd__goal-summary">
        <img src={GOAL_ART[goal.icon]} alt="" />
        <div>
          <strong>{formatMoney(saved, currency)}</strong>
          <span>of {formatMoney(goal.target, currency)} · {Math.round(pct)}%</span>
        </div>
      </div>
      <AmountInput value={text} onChange={setText} currency={currency} />
      <div className="bd__sheet-row">
        <button type="button" className="bd__secondary" disabled={amount <= 0 || amount > saved} onClick={() => { hapticTap(); onWithdraw(amount); }}>
          Withdraw
        </button>
        <button type="button" className="bd__primary" disabled={amount <= 0} onClick={() => { hapticTap(); onAdd(amount); }}>
          Add Money
        </button>
      </div>
      {confirmDelete ? (
        <div className="bd__sheet-row">
          <button type="button" className="bd__secondary" onClick={() => setConfirmDelete(false)}>Keep</button>
          <button type="button" className="bd__danger" onClick={onDelete}>Delete goal &amp; its history</button>
        </div>
      ) : (
        <button type="button" className="bd__text-danger" onClick={() => setConfirmDelete(true)}>
          <Icon name="trash" size={15} /> Delete goal
        </button>
      )}
    </Sheet>
  );
}

const THRESHOLDS = [50, 80, 90, 100];

export function AlertsSheet({
  enabled,
  threshold,
  onSave,
  onClose,
}: {
  enabled: boolean;
  threshold: number;
  onSave: (enabled: boolean, threshold: number) => void;
  onClose: () => void;
}) {
  const [on, setOn] = useState(enabled);
  const [pct, setPct] = useState(threshold);
  return (
    <Sheet title="Budget Alerts" onClose={onClose}>
      <button type="button" className="bd__toggle-row" onClick={() => { hapticSelect(); setOn((v) => !v); }}>
        <span>
          <strong>Highlight categories near their limit</strong>
          <small>Shows a warning on any category that reaches the level below.</small>
        </span>
        <span className={`bd__switch${on ? ' bd__switch--on' : ''}`}><span /></span>
      </button>
      <p className="bd__sheet-label">Warn at</p>
      <div className="bd__chips">
        {THRESHOLDS.map((t) => (
          <button key={t} type="button" disabled={!on} className={`bd__chip${pct === t ? ' bd__chip--on' : ''}`} onClick={() => { hapticSelect(); setPct(t); }}>
            {t}%
          </button>
        ))}
      </div>
      <button type="button" className="bd__primary" onClick={() => { hapticTap(); onSave(on, pct); }}>Save</button>
    </Sheet>
  );
}

export function RolloverSheet({ enabled, onSave, onClose }: { enabled: boolean; onSave: (on: boolean) => void; onClose: () => void }) {
  const [on, setOn] = useState(enabled);
  return (
    <Sheet title="Month Rollover" onClose={onClose}>
      <button type="button" className="bd__toggle-row" onClick={() => { hapticSelect(); setOn((v) => !v); }}>
        <span>
          <strong>Carry unspent budget forward</strong>
          <small>Money you didn&rsquo;t spend last month is added to this month&rsquo;s budget.</small>
        </span>
        <span className={`bd__switch${on ? ' bd__switch--on' : ''}`}><span /></span>
      </button>
      <button type="button" className="bd__primary" onClick={() => { hapticTap(); onSave(on); }}>Save</button>
    </Sheet>
  );
}

export function ConfirmSheet({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet title={title} onClose={onClose}>
      <p className="bd__sheet-hint">{message}</p>
      <div className="bd__sheet-row">
        <button type="button" className="bd__secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="bd__danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Sheet>
  );
}

export function MenuSheet({ title, items, onClose }: { title: string; items: { label: string; icon: Parameters<typeof Icon>[0]['name']; onClick: () => void }[]; onClose: () => void }) {
  return (
    <Sheet title={title} onClose={onClose}>
      <div className="bd__menu">
        {items.map((it) => (
          <button key={it.label} type="button" className="bd__menu-item" onClick={it.onClick}>
            <Icon name={it.icon} size={18} />
            {it.label}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

export function CurrencySheet({ currency, onSelect, onClose }: { currency: string; onSelect: (code: string) => void; onClose: () => void }) {
  return (
    <Sheet title="Currency" onClose={onClose}>
      <div className="bd__currency-grid">
        {CURRENCIES.map((c) => (
          <button key={c.code} type="button" className={`bd__chip${currency === c.code ? ' bd__chip--on' : ''}`} onClick={() => onSelect(c.code)}>
            <span>{c.flag}</span> {c.code}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
