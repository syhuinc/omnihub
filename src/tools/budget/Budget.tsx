import { useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { useBackHandler } from '../../app/useBackHandler';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import { EXPENSE_CATEGORIES } from '../expense-tracker/categories';
import { currentMonthKey, formatMonthLabel } from '../expense-tracker/month';
import type { Expense } from '../expense-tracker/types';
import './Budget.css';

type Budgets = Record<string, number>;

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function Budget() {
  const { back } = useRouter();
  const [budgets, setBudgets] = useState<Budgets>(() => storageGet(StorageKeys.budgets, {}));
  const [expenses] = useState<Expense[]>(() => storageGet(StorageKeys.expenses, []));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState('');

  const monthKey = currentMonthKey();

  const spentByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of expenses) {
      if (e.dateISO.slice(0, 7) !== monthKey) continue;
      totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount);
    }
    return totals;
  }, [expenses, monthKey]);

  const totalBudget = Object.values(budgets).reduce((sum, v) => sum + (v || 0), 0);
  const totalSpent = [...spentByCategory.values()].reduce((sum, v) => sum + v, 0);

  function saveBudget(categoryId: string, value: number) {
    const next = { ...budgets, [categoryId]: value };
    setBudgets(next);
    storageSet(StorageKeys.budgets, next);
  }

  function startEdit(categoryId: string) {
    setEditingId(categoryId);
    setDraftValue(budgets[categoryId] ? String(budgets[categoryId]) : '');
  }

  function commitEdit() {
    if (!editingId) return;
    const numeric = parseFloat(draftValue);
    saveBudget(editingId, Number.isNaN(numeric) || numeric < 0 ? 0 : numeric);
    setEditingId(null);
  }

  useBackHandler(() => {
    commitEdit();
    back();
  }, editingId !== null);

  return (
    <div className="screen">
      <ScreenHeader title="Budget" subtitle={formatMonthLabel(monthKey)} onBack={back} />

      <div className="bg__summary">
        <div className="bg__summary-item">
          <span>Budgeted</span>
          <strong>{formatMoney(totalBudget)}</strong>
        </div>
        <div className="bg__summary-divider" />
        <div className="bg__summary-item">
          <span>Spent</span>
          <strong className={totalSpent > totalBudget && totalBudget > 0 ? 'bg__over' : ''}>
            {formatMoney(totalSpent)}
          </strong>
        </div>
      </div>

      <ul className="bg__list">
        {EXPENSE_CATEGORIES.map((cat) => {
          const spent = spentByCategory.get(cat.id) ?? 0;
          const limit = budgets[cat.id] ?? 0;
          const hasLimit = limit > 0;
          const pct = hasLimit ? Math.min(100, (spent / limit) * 100) : 0;
          const over = hasLimit && spent > limit;

          return (
            <li key={cat.id} className="bg__card">
              <div className="bg__card-top">
                <span className="bg__card-name">
                  <Icon name={cat.icon} size={16} style={{ color: cat.color }} />
                  {cat.label}
                </span>
                {editingId === cat.id ? (
                  <input
                    className="bg__limit-input"
                    type="number"
                    inputMode="decimal"
                    autoFocus
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit();
                    }}
                  />
                ) : (
                  <button type="button" className="bg__limit-btn" onClick={() => startEdit(cat.id)}>
                    {hasLimit ? `Limit ${formatMoney(limit)}` : 'Set limit'}
                  </button>
                )}
              </div>

              {hasLimit && (
                <>
                  <div className="bg__track">
                    <div
                      className="bg__bar"
                      style={{ width: `${pct}%`, background: over ? 'var(--red)' : cat.color }}
                    />
                  </div>
                  <div className="bg__card-bottom">
                    <span className={over ? 'bg__over' : ''}>
                      {formatMoney(spent)} of {formatMoney(limit)}
                    </span>
                    {over && <span className="bg__over-label">Over budget</span>}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
