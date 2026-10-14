import { storageGet, storageSet } from '../../storage/db';

// Kept under the app's `omnihub:` prefix so they are included in Data & Sync backups.
const KEYS = {
  prefs: 'omnihub:budget.prefs',
  goals: 'omnihub:savings.goals',
  entries: 'omnihub:savings.entries',
} as const;

export interface BudgetPrefs {
  /** Overall budget for a month; 0 means "use the sum of the category budgets". */
  monthlyBudget: number;
  /** Planned amount to put into savings each month. */
  savingsAllocation: number;
  alertsEnabled: boolean;
  alertThresholdPct: number;
  /** Carry last month's unspent budget into this month. */
  rollover: boolean;
}

export type GoalIcon = 'laptop' | 'island' | 'piggy' | 'target' | 'wallet' | 'calendar' | 'document' | 'chart';

export interface SavingsGoal {
  id: string;
  name: string;
  icon: GoalIcon;
  target: number;
  createdAt: number;
}

export interface SavingsEntry {
  id: string;
  amount: number;
  /** null = general savings, not tied to a goal. */
  goalId: string | null;
  dateISO: string;
  createdAt: number;
}

export const DEFAULT_PREFS: BudgetPrefs = {
  monthlyBudget: 0,
  savingsAllocation: 0,
  alertsEnabled: true,
  alertThresholdPct: 80,
  rollover: false,
};

export function loadPrefs(): BudgetPrefs {
  return { ...DEFAULT_PREFS, ...storageGet<Partial<BudgetPrefs>>(KEYS.prefs, {}) };
}

export function savePrefs(prefs: BudgetPrefs): void {
  storageSet(KEYS.prefs, prefs);
}

export function loadGoals(): SavingsGoal[] {
  return storageGet<SavingsGoal[]>(KEYS.goals, []);
}

export function saveGoals(goals: SavingsGoal[]): void {
  storageSet(KEYS.goals, goals);
}

export function loadEntries(): SavingsEntry[] {
  return storageGet<SavingsEntry[]>(KEYS.entries, []);
}

export function saveEntries(entries: SavingsEntry[]): void {
  storageSet(KEYS.entries, entries);
}

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatShortDate(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
