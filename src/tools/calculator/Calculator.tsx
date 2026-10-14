import { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { useBackHandler } from '../../app/useBackHandler';
import { hapticSelect, hapticTap, hapticWarning } from '../../haptics';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import {
  evaluateExpression,
  formatResult,
  hasOperation,
  pushBracket,
  pushDigit,
  pushOperator,
  pushPercent,
  type CalculatorHistoryEntry,
  type ExprOp,
} from './logic';
import { NumberScanner } from './NumberScanner';
import './Calculator.css';

const MAX_HISTORY = 50;

/** Adds thousands separators to every number in an expression, for display only. */
function pretty(expr: string): string {
  return expr.replace(/\d+(\.\d*)?/g, (n) => {
    const [int, frac] = n.split('.');
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return frac === undefined ? grouped : `${grouped}.${frac}`;
  });
}

/** Big readout shrinks as the expression grows, like a phone calculator. */
function readoutSize(text: string): number {
  const n = text.length;
  if (n <= 6) return 80;
  if (n <= 8) return 66;
  if (n <= 10) return 54;
  if (n <= 13) return 44;
  return 36;
}

function OpGlyph({ op }: { op: ExprOp | '=' }) {
  return (
    <svg className="calc2__glyph" viewBox="0 0 32 32" aria-hidden="true">
      {op === '÷' && (
        <>
          <path d="M5 16h22" />
          <circle cx="16" cy="7.5" r="2.6" className="calc2__dot" />
          <circle cx="16" cy="24.5" r="2.6" className="calc2__dot" />
        </>
      )}
      {op === '×' && <path d="M7 7l18 18M25 7L7 25" />}
      {op === '−' && <path d="M6 16h20" />}
      {op === '+' && <path d="M16 5v22M5 16h22" />}
      {op === '=' && <path d="M6 11h20M6 21h20" className="calc2__eq-bars" />}
    </svg>
  );
}

type Overlay = 'history' | 'menu' | null;

export function Calculator() {
  const { back } = useRouter();
  const [expr, setExpr] = useState('');
  const [lastExpr, setLastExpr] = useState('');
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [error, setError] = useState('');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [history, setHistory] = useState<CalculatorHistoryEntry[]>(() => storageGet(StorageKeys.calculatorHistory, []));

  useBackHandler(() => setOverlay(null), overlay !== null);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 2200);
    return () => clearTimeout(t);
  }, [error]);

  function saveHistory(next: CalculatorHistoryEntry[]) {
    setHistory(next);
    storageSet(StorageKeys.calculatorHistory, next);
  }

  function edit(next: string) {
    setExpr(next);
    setJustEvaluated(false);
    setError('');
  }

  function digit(d: string) {
    hapticSelect();
    edit(pushDigit(justEvaluated ? '' : expr, d));
    if (justEvaluated) setLastExpr('');
  }

  function operator(op: ExprOp) {
    hapticSelect();
    edit(pushOperator(expr, op));
  }

  function bracket() {
    hapticSelect();
    edit(pushBracket(justEvaluated ? '' : expr));
  }

  function percent() {
    hapticSelect();
    edit(pushPercent(expr));
  }

  function backspace() {
    hapticSelect();
    edit(justEvaluated ? '' : expr.slice(0, -1));
  }

  function clearAll() {
    hapticTap();
    edit('');
    setLastExpr('');
  }

  function equals() {
    if (!expr || !hasOperation(expr)) return;
    const value = evaluateExpression(expr);
    if (!Number.isFinite(value)) {
      hapticWarning();
      setError(value === Infinity ? "Can't divide by 0" : 'Invalid expression');
      return;
    }
    hapticTap();
    const result = formatResult(value);
    saveHistory(
      [{ id: `${Date.now()}`, expression: pretty(expr), result, timestamp: Date.now() }, ...history].slice(0, MAX_HISTORY),
    );
    setLastExpr(expr);
    setExpr(result.startsWith('-') ? `−${result.slice(1)}` : result);
    setJustEvaluated(true);
  }

  function loadResult(value: string) {
    edit(value.startsWith('-') ? `−${value.slice(1)}` : value);
    setLastExpr('');
    setJustEvaluated(true);
    setOverlay(null);
  }

  if (showScanner) {
    return (
      <NumberScanner
        onUseResult={(n) => { loadResult(formatResult(n)); setShowScanner(false); }}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  const shown = pretty(expr || '0');
  const live = !justEvaluated && hasOperation(expr) ? evaluateExpression(expr) : NaN;
  const preview = error || (justEvaluated ? (lastExpr ? `${pretty(lastExpr)} =` : '') : Number.isFinite(live) ? `= ${pretty(formatResult(live).replace('-', '−'))}` : '');

  return (
    <div className="screen calc2">
      <header className="calc2__top">
        <div className="calc2__top-left">
          <button type="button" className="calc2__round" onClick={() => { hapticTap(); back(); }} aria-label="Back">
            <Icon name="arrow-left" size={26} strokeWidth={2.5} />
          </button>
          <button type="button" className="calc2__round" onClick={() => { hapticTap(); setOverlay(overlay === 'history' ? null : 'history'); }} aria-label="History">
            <Icon name="history" size={28} strokeWidth={2.5} />
          </button>
        </div>
        <button type="button" className="calc2__round" onClick={() => { hapticTap(); setOverlay('menu'); }} aria-label="More options">
          <Icon name="more-vertical" size={28} strokeWidth={4} />
        </button>
      </header>

      <section className="calc2__display" aria-live="polite">
        <svg className="calc2__arcs" viewBox="0 0 160 184" preserveAspectRatio="xMinYMax meet" aria-hidden="true">
          <path className="calc2__arc-fill" d="M0 64C28 128 72 170 138 184H0Z" />
          <path className="calc2__arc-line" d="M0 64C28 128 72 170 138 184" />
          <path className="calc2__arc-fill calc2__arc-fill--inner" d="M0 112C40 118 74 148 88 184H0Z" />
          <path className="calc2__arc-line calc2__arc-line--inner" d="M0 112C40 118 74 148 88 184" />
        </svg>
        <div className={`calc2__preview${error ? ' calc2__preview--error' : ''}`}>{preview}</div>
        <div className="calc2__readout" style={{ fontSize: readoutSize(shown) }}>
          {shown}
          <i className="calc2__caret" />
        </div>
      </section>

      <button type="button" className="calc2__handle" onClick={() => { hapticTap(); setOverlay('history'); }} aria-label="Show history" />

      <div className="calc2__pad">
        <button type="button" className="calc2__key calc2__key--ac" onClick={clearAll}>AC</button>
        <button type="button" className="calc2__key calc2__key--fn" onClick={bracket} aria-label="Brackets">( )</button>
        <button type="button" className="calc2__key calc2__key--fn" onClick={percent}>%</button>
        <button type="button" className="calc2__key calc2__key--op" onClick={() => operator('÷')} aria-label="Divide"><OpGlyph op="÷" /></button>

        {['7', '8', '9'].map((d) => <button key={d} type="button" className="calc2__key" onClick={() => digit(d)}>{d}</button>)}
        <button type="button" className="calc2__key calc2__key--op" onClick={() => operator('×')} aria-label="Multiply"><OpGlyph op="×" /></button>

        {['4', '5', '6'].map((d) => <button key={d} type="button" className="calc2__key" onClick={() => digit(d)}>{d}</button>)}
        <button type="button" className="calc2__key calc2__key--op" onClick={() => operator('−')} aria-label="Subtract"><OpGlyph op="−" /></button>

        {['1', '2', '3'].map((d) => <button key={d} type="button" className="calc2__key" onClick={() => digit(d)}>{d}</button>)}
        <button type="button" className="calc2__key calc2__key--op" onClick={() => operator('+')} aria-label="Add"><OpGlyph op="+" /></button>

        <button type="button" className="calc2__key calc2__key--wide" onClick={() => digit('0')}>0</button>
        <button type="button" className="calc2__key calc2__key--wide" onClick={() => digit('.')} aria-label="Decimal point">.</button>
        <button type="button" className="calc2__key calc2__key--wide" onClick={backspace} aria-label="Backspace">
          <Icon name="backspace" size={32} strokeWidth={2.1} />
        </button>
        <button type="button" className="calc2__key calc2__key--eq" onClick={equals} aria-label="Equals"><OpGlyph op="=" /></button>
      </div>

      {overlay === 'history' && (
        <div className="calc2__scrim" onClick={() => setOverlay(null)}>
          <div className="calc2__sheet" onClick={(e) => e.stopPropagation()}>
            <div className="calc2__sheet-grip" />
            <h2 className="calc2__sheet-title">History</h2>
            {history.length === 0 ? (
              <p className="calc2__empty">No calculations yet.</p>
            ) : (
              <>
                <ul className="calc2__history">
                  {history.map((h) => (
                    <li key={h.id}>
                      <button type="button" onClick={() => { hapticTap(); loadResult(h.result); }}>
                        <span>{h.expression} =</span>
                        <strong>{pretty(h.result.replace('-', '−'))}</strong>
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="calc2__clear" onClick={() => { hapticWarning(); saveHistory([]); }}>
                  Clear history
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {overlay === 'menu' && (
        <div className="calc2__scrim calc2__scrim--clear" onClick={() => setOverlay(null)}>
          <div className="calc2__menu" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => { hapticTap(); setOverlay(null); setShowScanner(true); }}>
              <Icon name="scan" size={19} /> Scan numbers
            </button>
            <button type="button" onClick={() => { hapticTap(); setOverlay('history'); }}>
              <Icon name="history" size={19} /> History
            </button>
            <button type="button" disabled={history.length === 0} onClick={() => { hapticWarning(); saveHistory([]); setOverlay(null); }}>
              <Icon name="trash" size={19} /> Clear history
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
