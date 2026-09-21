import { useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import { DiceFace } from './DiceFace';
import './RandomGenerator.css';

type Mode = 'dice' | 'coin' | 'number' | 'list';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function RandomGenerator() {
  const { back } = useRouter();
  const [mode, setMode] = useState<Mode>('dice');

  // Dice
  const [diceCount, setDiceCount] = useState(2);
  const [diceResults, setDiceResults] = useState<number[]>([]);

  // Coin
  const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);
  const [flipping, setFlipping] = useState(false);

  // Number
  const [minText, setMinText] = useState('1');
  const [maxText, setMaxText] = useState('100');
  const [numberResult, setNumberResult] = useState<number | null>(null);

  // List
  const [items, setItems] = useState<string[]>(() => storageGet(StorageKeys.randomLists, []));
  const [newItem, setNewItem] = useState('');
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);

  function persistItems(next: string[]) {
    setItems(next);
    storageSet(StorageKeys.randomLists, next);
  }

  function rollDice() {
    setDiceResults(Array.from({ length: diceCount }, () => randomInt(1, 6)));
  }

  function flipCoin() {
    setFlipping(true);
    setTimeout(() => {
      setCoinResult(Math.random() < 0.5 ? 'heads' : 'tails');
      setFlipping(false);
    }, 400);
  }

  function generateNumber() {
    const min = parseInt(minText, 10);
    const max = parseInt(maxText, 10);
    if (Number.isNaN(min) || Number.isNaN(max) || min > max) return;
    setNumberResult(randomInt(min, max));
  }

  function addItem() {
    const text = newItem.trim();
    if (!text) return;
    persistItems([...items, text]);
    setNewItem('');
    setWinnerIndex(null);
  }

  function removeItem(index: number) {
    persistItems(items.filter((_, i) => i !== index));
    setWinnerIndex(null);
  }

  function pickFromList() {
    if (items.length === 0) return;
    setWinnerIndex(randomInt(0, items.length - 1));
  }

  return (
    <div className="screen">
      <ScreenHeader title="Random Generator" onBack={back} />

      <div className="rg__tabs">
        {(['dice', 'coin', 'number', 'list'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`rg__tab${mode === m ? ' rg__tab--active' : ''}`}
            onClick={() => setMode(m)}
          >
            {m === 'dice' ? 'Dice' : m === 'coin' ? 'Coin' : m === 'number' ? 'Number' : 'List'}
          </button>
        ))}
      </div>

      {mode === 'dice' && (
        <div className="rg__body">
          <div className="rg__stepper-row">
            <span className="rg__stepper-label">Dice</span>
            <div className="rg__stepper">
              <button type="button" onClick={() => setDiceCount((c) => Math.max(1, c - 1))} aria-label="Fewer dice">
                −
              </button>
              <span>{diceCount}</span>
              <button type="button" onClick={() => setDiceCount((c) => Math.min(6, c + 1))} aria-label="More dice">
                +
              </button>
            </div>
          </div>

          {diceResults.length > 0 && (
            <>
              <div className="rg__dice-row">
                {diceResults.map((value, i) => (
                  <DiceFace key={i} value={value} />
                ))}
              </div>
              {diceResults.length > 1 && (
                <p className="rg__sum">Total: {diceResults.reduce((a, b) => a + b, 0)}</p>
              )}
            </>
          )}

          <button type="button" className="rg__action-btn" onClick={rollDice}>
            Roll {diceCount > 1 ? `${diceCount} Dice` : 'Dice'}
          </button>
        </div>
      )}

      {mode === 'coin' && (
        <div className="rg__body rg__body--center">
          <div className={`rg__coin${flipping ? ' rg__coin--flipping' : ''}`}>
            {coinResult === 'heads' ? 'H' : coinResult === 'tails' ? 'T' : '?'}
          </div>
          {coinResult && !flipping && (
            <p className="rg__coin-label">{coinResult === 'heads' ? 'Heads!' : 'Tails!'}</p>
          )}
          <button type="button" className="rg__action-btn" onClick={flipCoin} disabled={flipping}>
            Flip Coin
          </button>
        </div>
      )}

      {mode === 'number' && (
        <div className="rg__body">
          <div className="rg__range-row">
            <div className="rg__range-field">
              <label>Min</label>
              <input type="number" inputMode="numeric" value={minText} onChange={(e) => setMinText(e.target.value)} />
            </div>
            <div className="rg__range-field">
              <label>Max</label>
              <input type="number" inputMode="numeric" value={maxText} onChange={(e) => setMaxText(e.target.value)} />
            </div>
          </div>

          {numberResult !== null && <div className="rg__number-result">{numberResult}</div>}

          <button type="button" className="rg__action-btn" onClick={generateNumber}>
            Generate
          </button>
        </div>
      )}

      {mode === 'list' && (
        <div className="rg__body">
          <div className="rg__add-row">
            <input
              className="rg__add-input"
              value={newItem}
              placeholder="Add an item..."
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addItem();
              }}
            />
            <button type="button" className="rg__add-btn" onClick={addItem} aria-label="Add item">
              <Icon name="plus" size={18} />
            </button>
          </div>

          {items.length === 0 ? (
            <p className="rg__empty">Add a few items, then tap Pick to choose one at random.</p>
          ) : (
            <>
              <ul className="rg__items">
                {items.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className={`rg__item${winnerIndex === index ? ' rg__item--winner' : ''}`}
                  >
                    <span>{item}</span>
                    <button type="button" onClick={() => removeItem(index)} aria-label="Remove item">
                      <Icon name="x" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="rg__action-btn" onClick={pickFromList}>
                Pick Random
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
