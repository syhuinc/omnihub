import { useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { SwipeToDelete } from '../../components/SwipeToDelete';
import { useRouter } from '../../app/Router';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import type { DebtDirection, DebtEntry } from './types';
import './DebtCalculator.css';

function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return '$0.00';
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DebtCalculator() {
  const { back } = useRouter();
  const [debts, setDebts] = useState<DebtEntry[]>(() => storageGet(StorageKeys.debts, []));
  const [person, setPerson] = useState('');
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [direction, setDirection] = useState<DebtDirection>('owed_to_me');
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);

  function persist(next: DebtEntry[]) {
    setDebts(next);
    storageSet(StorageKeys.debts, next);
  }

  function addDebt() {
    const amount = parseFloat(amountText);
    if (!person.trim() || !amount || amount <= 0) return;
    const entry: DebtEntry = {
      id: `${Date.now()}`,
      person: person.trim(),
      amount,
      direction,
      note: note.trim() || undefined,
      createdAt: Date.now(),
    };
    persist([entry, ...debts]);
    setPerson('');
    setAmountText('');
    setNote('');
  }

  function settleDebt(id: string) {
    persist(debts.filter((d) => d.id !== id));
  }

  const { owedToMe, iOwe, net } = useMemo(() => {
    const owedToMe = debts.filter((d) => d.direction === 'owed_to_me').reduce((sum, d) => sum + d.amount, 0);
    const iOwe = debts.filter((d) => d.direction === 'i_owe').reduce((sum, d) => sum + d.amount, 0);
    return { owedToMe, iOwe, net: owedToMe - iOwe };
  }, [debts]);

  return (
    <div className="screen">
      <ScreenHeader title="Debt Tracker" onBack={back} />

      <div className="dc__body">
        <div className="dc__summary">
          <div className="dc__summary-item">
            <span>Owed to You</span>
            <strong className="dc__summary-value--green">{formatMoney(owedToMe)}</strong>
          </div>
          <div className="dc__summary-divider" />
          <div className="dc__summary-item">
            <span>You Owe</span>
            <strong className="dc__summary-value--red">{formatMoney(iOwe)}</strong>
          </div>
        </div>

        {debts.length > 0 && (
          <div className={`dc__net dc__net--${net >= 0 ? 'positive' : 'negative'}`}>
            {net >= 0
              ? `Overall, people owe you ${formatMoney(net)}`
              : `Overall, you owe ${formatMoney(Math.abs(net))}`}
          </div>
        )}

        <div className="dc__add">
          <div className="dc__direction-row">
            <button
              type="button"
              className={`dc__direction-chip${direction === 'owed_to_me' ? ' dc__direction-chip--active-green' : ''}`}
              onClick={() => setDirection('owed_to_me')}
            >
              They owe me
            </button>
            <button
              type="button"
              className={`dc__direction-chip${direction === 'i_owe' ? ' dc__direction-chip--active-red' : ''}`}
              onClick={() => setDirection('i_owe')}
            >
              I owe them
            </button>
          </div>

          <input
            className="dc__add-input"
            placeholder="Person's name"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
          />

          <div className="dc__add-amount-row">
            <span>$</span>
            <input
              className="dc__add-amount"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
            />
          </div>

          <input
            className="dc__add-input"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button type="button" className="dc__add-btn" onClick={addDebt}>
            <Icon name="plus" size={16} />
            Add Debt
          </button>
        </div>

        {debts.length === 0 ? (
          <p className="dc__empty">No debts tracked yet. Add who owes you, or who you owe, above.</p>
        ) : (
          <ul className="dc__list">
            {[...debts].sort((a, b) => b.createdAt - a.createdAt).map((debt) => (
              <li key={debt.id}>
                <SwipeToDelete
                  id={debt.id}
                  openId={openSwipeId}
                  onOpenChange={setOpenSwipeId}
                  onDelete={() => settleDebt(debt.id)}
                >
                  <div className="dc__row">
                    <span className={`dc__row-icon dc__row-icon--${debt.direction === 'owed_to_me' ? 'green' : 'red'}`}>
                      <Icon name="user" size={16} />
                    </span>
                    <span className="dc__row-info">
                      <span className="dc__row-name">{debt.person}</span>
                      <span className="dc__row-note">
                        {debt.direction === 'owed_to_me' ? 'Owes you' : 'You owe'}
                        {debt.note ? ` — ${debt.note}` : ''}
                      </span>
                    </span>
                    <span className={`dc__row-amount dc__row-amount--${debt.direction === 'owed_to_me' ? 'green' : 'red'}`}>
                      {debt.direction === 'owed_to_me' ? '+' : '-'}
                      {formatMoney(debt.amount)}
                    </span>
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
