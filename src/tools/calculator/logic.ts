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
