import type { IconName } from '../../components/Icon';

export interface ExpenseCategory {
  id: string;
  label: string;
  color: string;
  icon: IconName;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'food', label: 'Food', color: 'var(--orange)', icon: 'food' },
  { id: 'transport', label: 'Transport', color: 'var(--blue)', icon: 'transport' },
  { id: 'shopping', label: 'Shopping', color: 'var(--purple)', icon: 'shopping' },
  { id: 'bills', label: 'Bills', color: 'var(--red)', icon: 'receipt' },
  { id: 'entertainment', label: 'Entertainment', color: 'var(--pink)', icon: 'entertainment' },
  { id: 'health', label: 'Health', color: 'var(--teal)', icon: 'health' },
  { id: 'other', label: 'Other', color: 'var(--yellow)', icon: 'more-dots' },
];

export function getCategory(id: string): ExpenseCategory {
  return EXPENSE_CATEGORIES.find((c) => c.id === id) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}
