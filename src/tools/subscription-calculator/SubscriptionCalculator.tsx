import { useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { SwipeToDelete } from '../../components/SwipeToDelete';
import { useRouter } from '../../app/Router';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import type { BillingCycle, Subscription } from './types';
import './SubscriptionCalculator.css';

const CYCLES: { id: BillingCycle; label: string; perMonth: (amount: number) => number }[] = [
  { id: 'weekly', label: 'Weekly', perMonth: (a) => a * 4.345 },
  { id: 'monthly', label: 'Monthly', perMonth: (a) => a },
  { id: 'yearly', label: 'Yearly', perMonth: (a) => a / 12 },
];

function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return '$0.00';
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function SubscriptionCalculator() {
  const { back } = useRouter();
  const [subs, setSubs] = useState<Subscription[]>(() => storageGet(StorageKeys.subscriptions, []));
  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);

  function persist(next: Subscription[]) {
    setSubs(next);
    storageSet(StorageKeys.subscriptions, next);
  }

  function addSubscription() {
    const amount = parseFloat(amountText);
    if (!name.trim() || !amount || amount <= 0) return;
    const sub: Subscription = { id: `${Date.now()}`, name: name.trim(), amount, cycle, createdAt: Date.now() };
    persist([sub, ...subs]);
    setName('');
    setAmountText('');
  }

  function deleteSubscription(id: string) {
    persist(subs.filter((s) => s.id !== id));
  }

  const { monthlyTotal, yearlyTotal } = useMemo(() => {
    const monthly = subs.reduce((sum, s) => {
      const cycleDef = CYCLES.find((c) => c.id === s.cycle);
      return sum + (cycleDef ? cycleDef.perMonth(s.amount) : s.amount);
    }, 0);
    return { monthlyTotal: monthly, yearlyTotal: monthly * 12 };
  }, [subs]);

  return (
    <div className="screen">
      <ScreenHeader title="Subscription Calculator" onBack={back} />

      <div className="sc__body">
        <div className="sc__summary">
          <div className="sc__summary-item">
            <span>Per Month</span>
            <strong>{formatMoney(monthlyTotal)}</strong>
          </div>
          <div className="sc__summary-divider" />
          <div className="sc__summary-item">
            <span>Per Year</span>
            <strong>{formatMoney(yearlyTotal)}</strong>
          </div>
        </div>

        <div className="sc__add">
          <input
            className="sc__add-name"
            placeholder="Subscription name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="sc__add-row">
            <div className="sc__add-amount-row">
              <span>$</span>
              <input
                className="sc__add-amount"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
              />
            </div>
            <div className="sc__cycle-row">
              {CYCLES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`sc__cycle-chip${cycle === c.id ? ' sc__cycle-chip--active' : ''}`}
                  onClick={() => setCycle(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="sc__add-btn" onClick={addSubscription}>
            <Icon name="plus" size={16} />
            Add Subscription
          </button>
        </div>

        {subs.length === 0 ? (
          <p className="sc__empty">No subscriptions yet. Add your first one above.</p>
        ) : (
          <ul className="sc__list">
            {[...subs].sort((a, b) => b.createdAt - a.createdAt).map((sub) => (
              <li key={sub.id}>
                <SwipeToDelete
                  id={sub.id}
                  openId={openSwipeId}
                  onOpenChange={setOpenSwipeId}
                  onDelete={() => deleteSubscription(sub.id)}
                >
                  <div className="sc__row">
                    <span className="sc__row-icon">
                      <Icon name="repeat" size={16} />
                    </span>
                    <span className="sc__row-info">
                      <span className="sc__row-name">{sub.name}</span>
                      <span className="sc__row-cycle">{CYCLES.find((c) => c.id === sub.cycle)?.label}</span>
                    </span>
                    <span className="sc__row-amount">{formatMoney(sub.amount)}</span>
                  </div>
                </SwipeToDelete>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
