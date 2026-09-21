import { useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { UNIT_CATEGORIES, convert } from './data';
import './UnitConverter.css';

function formatNumber(value: number): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 1e6) / 1e6;
  return rounded.toString();
}

export function UnitConverter() {
  const { back } = useRouter();
  const [categoryId, setCategoryId] = useState(UNIT_CATEGORIES[0].id);
  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId)!;
  const [fromUnitId, setFromUnitId] = useState(category.units[0].id);
  const [toUnitId, setToUnitId] = useState(category.units[1].id);
  const [value, setValue] = useState('1');

  function selectCategory(id: string) {
    const nextCategory = UNIT_CATEGORIES.find((c) => c.id === id)!;
    setCategoryId(id);
    setFromUnitId(nextCategory.units[0].id);
    setToUnitId(nextCategory.units[1].id);
  }

  const result = useMemo(() => {
    const numeric = parseFloat(value);
    if (Number.isNaN(numeric)) return '';
    return formatNumber(convert(category, fromUnitId, toUnitId, numeric));
  }, [category, fromUnitId, toUnitId, value]);

  function swap() {
    setFromUnitId(toUnitId);
    setToUnitId(fromUnitId);
    if (result) setValue(result);
  }

  return (
    <div className="screen">
      <ScreenHeader title="Unit Converter" onBack={back} />

      <div className="uc__tabs">
        {UNIT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`uc__tab${cat.id === categoryId ? ' uc__tab--active' : ''}`}
            onClick={() => selectCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="uc__body">
        <div className="uc__field">
          <label className="uc__label">From</label>
          <div className="uc__row">
            <input
              className="uc__input"
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
            />
            <select
              className="uc__select"
              value={fromUnitId}
              onChange={(e) => setFromUnitId(e.target.value)}
            >
              {category.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="button" className="uc__swap" onClick={swap} aria-label="Swap units">
          <Icon name="converter" size={20} />
        </button>

        <div className="uc__field">
          <label className="uc__label">To</label>
          <div className="uc__row">
            <div className="uc__result">{result || '—'}</div>
            <select
              className="uc__select"
              value={toUnitId}
              onChange={(e) => setToUnitId(e.target.value)}
            >
              {category.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
