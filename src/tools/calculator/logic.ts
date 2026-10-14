export type Operator = '+' | '-' | '×' | '÷';

export function applyOperator(a: number, b: number, op: Operator): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? NaN : a / b;
  }
}

export function formatResult(value: number): string {
  if (Number.isNaN(value)) return 'Error';
  if (!Number.isFinite(value)) return 'Error';
  const rounded = Math.round(value * 1e10) / 1e10;
  return rounded.toString();
}

export interface CalculatorHistoryEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

/* ---- Expression input (main calculator) ----
 * The display holds a typed expression such as "12×(3+4)%". Operators use the
 * display glyphs: + − × ÷. evaluateExpression() closes any open brackets,
 * treats "2(3)" / "(2)(3)" as multiplication and "%" as divide-by-100. */

export const OPS = ['+', '−', '×', '÷'] as const;
export type ExprOp = (typeof OPS)[number];

const isOp = (c: string | undefined): c is ExprOp => !!c && (OPS as readonly string[]).includes(c);
const isDigit = (c: string | undefined) => !!c && c >= '0' && c <= '9';

/** Characters of the number currently being typed at the end of the expression. */
function trailingNumber(expr: string): string {
  const m = expr.match(/[0-9.]*$/);
  return m ? m[0] : '';
}

export function openBrackets(expr: string): number {
  let depth = 0;
  for (const c of expr) {
    if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
  }
  return depth;
}

export function pushDigit(expr: string, d: string): string {
  const num = trailingNumber(expr);
  if (d === '.') {
    if (num.includes('.')) return expr;
    if (num === '') return `${expr}${expr.endsWith(')') || expr.endsWith('%') ? '×' : ''}0.`;
    return expr + '.';
  }
  if (num === '0') return expr.slice(0, -1) + d;
  if (expr.endsWith(')') || expr.endsWith('%')) return `${expr}×${d}`;
  return expr + d;
}

export function pushOperator(expr: string, op: ExprOp): string {
  const last = expr.slice(-1);
  if (expr === '' || last === '(') return op === '−' ? expr + op : expr;
  if (isOp(last)) {
    const before = expr.slice(-2, -1);
    // "×−" style negative operand: replace both when picking a new operator.
    if (isOp(before)) return expr.length > 2 || op === '−' ? expr.slice(0, -2) + op : expr;
    if (op === '−' && (last === '×' || last === '÷')) return expr + op;
    return expr.slice(0, -1) + op;
  }
  if (last === '.') return expr + '0' + op;
  return expr + op;
}

/** "( )" key: closes a bracket when one is open and an operand just ended, otherwise opens one. */
export function pushBracket(expr: string): string {
  const last = expr.slice(-1);
  const operandEnded = isDigit(last) || last === ')' || last === '%' || last === '.';
  if (openBrackets(expr) > 0 && operandEnded) return expr + ')';
  return expr + (operandEnded ? '×(' : '(');
}

export function pushPercent(expr: string): string {
  const last = expr.slice(-1);
  return isDigit(last) || last === ')' ? expr + '%' : expr;
}

class DivideByZero extends Error {}

/** Returns NaN for anything that isn't a valid expression, Infinity for division by zero. */
export function evaluateExpression(input: string): number {
  let expr = input;
  while (isOp(expr.slice(-1)) || expr.endsWith('(')) expr = expr.slice(0, -1);
  if (!expr) return NaN;
  expr += ')'.repeat(openBrackets(expr));

  let i = 0;
  const peek = () => expr[i];

  function primary(): number {
    if (peek() === '(') {
      i++;
      const v = sum();
      if (peek() === ')') i++;
      return v;
    }
    const start = i;
    while (isDigit(peek()) || peek() === '.') i++;
    const text = expr.slice(start, i);
    if (!text || text === '.' || text.indexOf('.') !== text.lastIndexOf('.')) throw new Error('bad number');
    return parseFloat(text);
  }

  function postfix(): number {
    let v = primary();
    while (peek() === '%') {
      i++;
      v /= 100;
    }
    return v;
  }

  function unary(): number {
    if (peek() === '−') {
      i++;
      return -unary();
    }
    return postfix();
  }

  function product(): number {
    let v = unary();
    for (;;) {
      const c = peek();
      if (c === '×' || c === '÷') {
        i++;
        const r = unary();
        if (c === '÷' && r === 0) throw new DivideByZero();
        v = c === '×' ? v * r : v / r;
      } else if (c === '(' || isDigit(c)) {
        v *= unary(); // implicit multiplication: 2(3), (2)(3)
      } else {
        return v;
      }
    }
  }

  function sum(): number {
    let v = product();
    while (peek() === '+' || peek() === '−') {
      const c = expr[i++];
      const r = product();
      v = c === '+' ? v + r : v - r;
    }
    return v;
  }

  try {
    const v = sum();
    return i === expr.length ? v : NaN;
  } catch (err) {
    return err instanceof DivideByZero ? Infinity : NaN;
  }
}

/** Whether the expression is more than a lone number, i.e. worth showing a live result for. */
export function hasOperation(expr: string): boolean {
  return /[+×÷%()]|.−/.test(expr);
}
