import { useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { EXPENSE_CATEGORIES } from './categories';
import type { Expense } from './types';

interface AddExpenseProps {
  onSave: (expense: Expense) => void;
  onClose: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddExpense({ onSave, onClose }: AddExpenseProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(EXPENSE_CATEGORIES[0].id);
  const [note, setNote] = useState('');
  const [dateISO, setDateISO] = useState(todayISO());
  const [error, setError] = useState('');

  function save() {
    const numeric = parseFloat(amount);
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    onSave({ id: `${Date.now()}`, amount: numeric, categoryId, note: note.trim(), dateISO });
  }

  return (
    <div className="screen">
      <ScreenHeader title="Add Expense" onBack={onClose} />

      <div className="ae__body">
        <div className="ae__amount-row">
          <span className="ae__currency">$</span>
          <input
            className="ae__amount"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
            autoFocus
          />
        </div>
        {error && <p className="ae__error">{error}</p>}

        <label className="ae__label">Category</label>
        <div className="ae__categories">
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`ae__category${cat.id === categoryId ? ' ae__category--active' : ''}`}
              style={{ '--cat-color': cat.color } as React.CSSProperties}
              onClick={() => setCategoryId(cat.id)}
            >
              <Icon name={cat.icon} size={16} />
              {cat.label}
            </button>
          ))}
        </div>

        <label className="ae__label">Note (optional)</label>
        <input
          className="ae__input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was it for?"
        />

        <label className="ae__label">Date</label>
        <input
          className="ae__input"
          type="date"
          value={dateISO}
          onChange={(e) => setDateISO(e.target.value)}
        />

        <button type="button" className="ae__save" onClick={save}>
          Save Expense
        </button>
      </div>
    </div>
  );
}
