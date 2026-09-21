import { useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import { AddExpense } from './AddExpense';
import { EXPENSE_CATEGORIES, getCategory } from './categories';
import { currentMonthKey, formatMonthLabel, shiftMonthKey } from './month';
import type { Expense } from './types';
import './ExpenseTracker.css';

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function ExpenseTracker() {
  const { back } = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>(() => storageGet(StorageKeys.expenses, []));
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [adding, setAdding] = useState(false);

  function persist(next: Expense[]) {
    setExpenses(next);
    storageSet(StorageKeys.expenses, next);
  }

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.dateISO.slice(0, 7) === monthKey).sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)),
    [expenses, monthKey],
  );

  const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of monthExpenses) {
      totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount);
    }
    return EXPENSE_CATEGORIES.map((cat) => ({ cat, amount: totals.get(cat.id) ?? 0 }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [monthExpenses]);

  const maxCategoryAmount = categoryTotals[0]?.amount ?? 0;

  function addExpense(expense: Expense) {
    persist([expense, ...expenses]);
    setAdding(false);
  }

  function deleteExpense(id: string) {
    persist(expenses.filter((e) => e.id !== id));
  }

  if (adding) {
    return <AddExpense onSave={addExpense} onClose={() => setAdding(false)} />;
  }

  return (
    <div className="screen">
      <ScreenHeader title="Expense Tracker" onBack={back} />

      <div className="et__month-nav">
        <button type="button" onClick={() => setMonthKey(shiftMonthKey(monthKey, -1))} aria-label="Previous month">
          <Icon name="back" size={18} />
        </button>
        <span>{formatMonthLabel(monthKey)}</span>
        <button type="button" onClick={() => setMonthKey(shiftMonthKey(monthKey, 1))} aria-label="Next month">
          <Icon name="back" size={18} className="et__next-icon" />
        </button>
      </div>

      <div className="et__total-card">
        <span className="et__total-label">Total Spent</span>
        <span className="et__total-amount">{formatMoney(total)}</span>
      </div>

      {categoryTotals.length > 0 && (
        <div className="et__chart">
          {categoryTotals.map(({ cat, amount }) => (
            <div key={cat.id} className="et__chart-row">
              <span className="et__chart-label">
                <Icon name={cat.icon} size={14} style={{ color: cat.color }} />
                {cat.label}
              </span>
              <div className="et__chart-track">
                <div
                  className="et__chart-bar"
                  style={{ width: `${(amount / maxCategoryAmount) * 100}%`, background: cat.color }}
                />
              </div>
              <span className="et__chart-amount">{formatMoney(amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="et__list-header">
        <h2>Transactions</h2>
      </div>

      {monthExpenses.length === 0 ? (
        <p className="et__empty">No expenses for {formatMonthLabel(monthKey)} yet.</p>
      ) : (
        <ul className="et__list">
          {monthExpenses.map((expense) => {
            const cat = getCategory(expense.categoryId);
            return (
              <li key={expense.id} className="et__row">
                <span className="et__row-icon" style={{ background: `color-mix(in srgb, ${cat.color} 18%, transparent)`, color: cat.color }}>
                  <Icon name={cat.icon} size={16} />
                </span>
                <span className="et__row-info">
                  <span className="et__row-title">{expense.note || cat.label}</span>
                  <span className="et__row-date">{expense.dateISO}</span>
                </span>
                <span className="et__row-amount">{formatMoney(expense.amount)}</span>
                <button
                  type="button"
                  className="et__row-delete"
                  onClick={() => deleteExpense(expense.id)}
                  aria-label="Delete expense"
                >
                  <Icon name="x" size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" className="et__fab" onClick={() => setAdding(true)} aria-label="Add expense">
        <Icon name="plus" size={24} />
      </button>
    </div>
  );
}
