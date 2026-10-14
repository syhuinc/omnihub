import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { useBackHandler } from '../../app/useBackHandler';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import { hapticTap, hapticWarning } from '../../haptics';
import { useCloudSync } from '../../cloud/useCloudSync';
import { useIsLightTheme } from '../../theme/useTheme';
import { EXPENSE_CATEGORIES, getCategory, type ExpenseCategory } from '../expense-tracker/categories';
import { currentMonthKey, formatMonthLabel, shiftMonthKey } from '../expense-tracker/month';
import { DEFAULT_CURRENCY, formatMoney } from '../shared/currencies';
import type { Expense } from '../expense-tracker/types';
import type { BudgetLimit } from './types';
import { SetBudget } from './SetBudget';
import { ART, CATEGORY_ART, GOAL_ART } from './budgetArt';
import {
  formatShortDate,
  loadEntries,
  loadGoals,
  loadPrefs,
  newId,
  saveEntries,
  saveGoals,
  savePrefs,
  todayISO,
  type BudgetPrefs,
  type SavingsEntry,
  type SavingsGoal,
} from './budgetStore';
import {
  AddSavingsSheet,
  AlertsSheet,
  AmountSheet,
  ConfirmSheet,
  CurrencySheet,
  GoalEditorSheet,
  GoalSheet,
  MenuSheet,
  RolloverSheet,
} from './BudgetSheets';
import './Budget.css';

/** Reads budgets, migrating the old `{categoryId: amount}` map shape (pre-sync) into a list on first load. */
function loadBudgets(): BudgetLimit[] {
  const raw = storageGet<unknown>(StorageKeys.budgets, []);
  if (Array.isArray(raw)) return raw as BudgetLimit[];

  const legacy = raw as Record<string, number>;
  const now = Date.now();
  const migrated: BudgetLimit[] = Object.entries(legacy)
    .filter(([, amount]) => amount > 0)
    .map(([categoryId, amount]) => ({ id: categoryId, categoryId, amount, updatedAt: now }));
  storageSet(StorageKeys.budgets, migrated);
  return migrated;
}

type View = 'main' | 'savings' | 'settings' | 'categories' | 'goals' | 'history';
type SheetState =
  | { kind: 'monthly' }
  | { kind: 'allocation' }
  | { kind: 'alerts' }
  | { kind: 'rollover' }
  | { kind: 'reset' }
  | { kind: 'delete' }
  | { kind: 'currency' }
  | { kind: 'newGoal' }
  | { kind: 'goal'; goalId: string }
  | { kind: 'addSavings'; goalId: string | null }
  | { kind: 'savingsMenu' }
  | null;

const PARENT: Partial<Record<View, View>> = { savings: 'main', settings: 'main', categories: 'settings', goals: 'savings', history: 'savings' };

const pct = (part: number, whole: number) => (whole > 0 ? Math.min(100, (part / whole) * 100) : 0);

function spentByCategoryIn(expenses: Expense[], monthKey: string) {
  const totals = new Map<string, number>();
  for (const e of expenses) {
    if (e.dateISO.slice(0, 7) !== monthKey) continue;
    totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount);
  }
  return totals;
}

const sum = (values: Iterable<number>) => [...values].reduce((s, v) => s + v, 0);

function Header({ title, subtitle, onBack, onMore }: { title: string; subtitle?: string; onBack: () => void; onMore?: () => void }) {
  return (
    <header className="bd__header">
      <button type="button" className="bd__square-btn" onClick={onBack} aria-label="Back">
        <Icon name="arrow-left" size={22} strokeWidth={2.2} />
      </button>
      <div className="bd__header-titles">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {onMore ? (
        <button type="button" className="bd__square-btn" onClick={onMore} aria-label="More options">
          <Icon name="more-dots" size={24} strokeWidth={3} />
        </button>
      ) : (
        <span className="bd__square-spacer" />
      )}
    </header>
  );
}

function SectionHead({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <div className="bd__section-head">
      <h2>{title}</h2>
      {onSeeAll && (
        <button type="button" className="bd__see-all" onClick={onSeeAll}>
          See All
        </button>
      )}
    </div>
  );
}

/** Light-theme "% used" ring on the main budget card. */
function Ring({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <span className="bd__ring">
      <svg viewBox="0 0 124 124" aria-hidden="true">
        <defs>
          <linearGradient id="bd-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3d8bff" />
            <stop offset="1" stopColor="#1f6ff2" />
          </linearGradient>
        </defs>
        <circle cx="62" cy="62" r={r} className="bd__ring-track" />
        {value > 0 && (
          <circle
            cx="62"
            cy="62"
            r={r}
            className="bd__ring-fill"
            stroke={value > 100 ? '#f0505a' : 'url(#bd-ring)'}
            strokeDasharray={`${(Math.min(100, value) / 100) * c} ${c}`}
            transform="rotate(-90 62 62)"
          />
        )}
      </svg>
      <span className="bd__ring-label">
        <strong>{Math.round(value)}%</strong>
        <small>USED</small>
      </span>
    </span>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="bd__track">
      <div className="bd__fill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export function Budget() {
  const { back } = useRouter();
  const isLight = useIsLightTheme();
  const [budgets, setBudgets] = useState<BudgetLimit[]>(() => loadBudgets());
  const [expenses] = useState<Expense[]>(() => storageGet(StorageKeys.expenses, []));
  const [prefs, setPrefs] = useState<BudgetPrefs>(() => loadPrefs());
  const [goals, setGoals] = useState<SavingsGoal[]>(() => loadGoals());
  const [entries, setEntries] = useState<SavingsEntry[]>(() => loadEntries());
  const [currency, setCurrency] = useState(() => storageGet(StorageKeys.budgetDefaultCurrency, DEFAULT_CURRENCY));
  const [view, setView] = useState<View>('main');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetState>(null);

  const monthKey = currentMonthKey();

  function rawPersist(next: BudgetLimit[]) {
    setBudgets(next);
    storageSet(StorageKeys.budgets, next);
  }
  const { persist } = useCloudSync('budgets', budgets, rawPersist);

  function updatePrefs(patch: Partial<BudgetPrefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(next);
  }
  function updateGoals(next: SavingsGoal[]) {
    setGoals(next);
    saveGoals(next);
  }
  function updateEntries(next: SavingsEntry[]) {
    setEntries(next);
    saveEntries(next);
  }

  const goBack = () => setView(PARENT[view] ?? 'main');
  useBackHandler(goBack, view !== 'main' && !editingCategoryId);

  const budgetMap = useMemo(() => new Map(budgets.map((b) => [b.categoryId, b])), [budgets]);
  const spentByCategory = useMemo(() => spentByCategoryIn(expenses, monthKey), [expenses, monthKey]);

  const categoryTotal = sum(budgets.map((b) => b.amount));
  const monthlyBase = prefs.monthlyBudget > 0 ? prefs.monthlyBudget : categoryTotal;
  const totalSpent = sum(spentByCategory.values());

  const rolloverAmount = useMemo(() => {
    if (!prefs.rollover || monthlyBase <= 0) return 0;
    const prevKey = shiftMonthKey(monthKey, -1);
    if (!expenses.some((e) => e.dateISO.slice(0, 7) === prevKey)) return 0;
    return Math.max(0, monthlyBase - sum(spentByCategoryIn(expenses, prevKey).values()));
  }, [prefs.rollover, monthlyBase, expenses, monthKey]);

  const available = monthlyBase + rolloverAmount;
  const remaining = available - totalSpent;
  const [year, month] = monthKey.split('-').map(Number);
  const daysLeft = Math.max(0, new Date(year, month, 0).getDate() - new Date().getDate());
  const monthExpenses = expenses.filter((e) => e.dateISO.slice(0, 7) === monthKey).length;
  const dailyAverage = totalSpent / Math.max(1, new Date().getDate());
  const usedPct = available > 0 ? (totalSpent / available) * 100 : 0;

  const totalSaved = sum(entries.map((e) => e.amount));
  const savedThisMonth = sum(entries.filter((e) => e.dateISO.slice(0, 7) === monthKey).map((e) => e.amount));
  const savedForGoal = (id: string) => sum(entries.filter((e) => e.goalId === id).map((e) => e.amount));
  const goalsOnTrack = goals.filter(
    (g) => savedForGoal(g.id) >= g.target || entries.some((e) => e.goalId === g.id && e.amount > 0 && e.dateISO.slice(0, 7) === monthKey),
  ).length;
  const recent = [...entries].sort((a, b) => b.dateISO.localeCompare(a.dateISO) || b.createdAt - a.createdAt);

  function addEntry(amount: number, goalId: string | null) {
    updateEntries([...entries, { id: newId(), amount, goalId, dateISO: todayISO(), createdAt: Date.now() }]);
  }

  function saveCategory(categoryId: string, patch: { amount: number; alertEnabled: boolean; alertThresholdPct: number }) {
    const without = budgets.filter((b) => b.categoryId !== categoryId);
    const existing = budgetMap.get(categoryId);
    persist(
      patch.amount > 0
        ? [
            ...without,
            {
              id: existing?.id ?? categoryId,
              categoryId,
              amount: patch.amount,
              alertEnabled: patch.alertEnabled,
              alertThresholdPct: patch.alertThresholdPct,
              updatedAt: Date.now(),
            },
          ]
        : without,
    );
    setEditingCategoryId(null);
  }

  if (editingCategoryId) {
    return (
      <SetBudget
        category={getCategory(editingCategoryId)}
        budget={budgetMap.get(editingCategoryId)}
        currency={currency}
        monthLabel={formatMonthLabel(monthKey)}
        spent={spentByCategory.get(editingCategoryId) ?? 0}
        onSave={(patch) => saveCategory(editingCategoryId, patch)}
        onDelete={() => {
          hapticWarning();
          persist(budgets.filter((b) => b.categoryId !== editingCategoryId));
          setEditingCategoryId(null);
        }}
        onClose={() => setEditingCategoryId(null)}
      />
    );
  }

  const close = () => setSheet(null);

  function categoryRow(cat: ExpenseCategory) {
    const spent = spentByCategory.get(cat.id) ?? 0;
    const limit = budgetMap.get(cat.id)?.amount ?? 0;
    const p = pct(spent, limit);
    const over = limit > 0 && spent > limit;
    const warn = !over && prefs.alertsEnabled && limit > 0 && p >= prefs.alertThresholdPct;
    const art = CATEGORY_ART[cat.id] ?? CATEGORY_ART.other;
    return (
      <button key={cat.id} type="button" className="bd__cat" onClick={() => { hapticTap(); setEditingCategoryId(cat.id); }}>
        <span className="bd__cat-tile" style={{ '--tile': art.tile, '--tile-light': art.tileLight } as CSSProperties}>
          <img src={art.img} alt="" />
        </span>
        <span className="bd__cat-body">
          <span className="bd__cat-top">
            <strong>{cat.label}</strong>
            <small>
              {formatMoney(spent, currency)} / {formatMoney(limit, currency)}
            </small>
          </span>
          <Bar value={p} color={over ? 'var(--red)' : cat.color} />
        </span>
        <span className={`bd__cat-pct${over ? ' bd__cat-pct--over' : warn ? ' bd__cat-pct--warn' : ''}`}>
          {Math.round(limit > 0 ? (spent / limit) * 100 : 0)}%
        </span>
      </button>
    );
  }

  function goalRow(g: SavingsGoal, i: number) {
    const saved = savedForGoal(g.id);
    const p = pct(saved, g.target);
    return (
      <button key={g.id} type="button" className="bd__goal" onClick={() => { hapticTap(); setSheet({ kind: 'goal', goalId: g.id }); }}>
        <span className="bd__goal-tile">
          <img src={GOAL_ART[g.icon]} alt="" />
        </span>
        <span className="bd__goal-body">
          <span className="bd__goal-top">
            <strong>{g.name}</strong>
            <b>{formatMoney(g.target, currency)}</b>
          </span>
          <span className="bd__goal-bar">
            <Bar value={p} color={i % 2 === 0 ? 'linear-gradient(90deg, #2ddfa3, #31e6ae)' : 'linear-gradient(90deg, #3482fc, #3a8dff)'} />
            <em>{Math.round(p)}%</em>
          </span>
          <span className="bd__goal-bottom">
            <span>{formatMoney(saved, currency)} saved</span>
            <span>{formatMoney(Math.max(0, g.target - saved), currency)} left</span>
          </span>
        </span>
        <Icon name="chevron-right" size={17} className="bd__chev" />
      </button>
    );
  }

  function entryRow(e: SavingsEntry) {
    const goal = e.goalId ? goals.find((g) => g.id === e.goalId) : undefined;
    const out = e.amount < 0;
    const icon: IconName = out ? 'upload' : goal ? 'dart' : 'arrow-down';
    return (
      <div key={e.id} className="bd__entry">
        <span className={`bd__entry-tile${goal ? ' bd__entry-tile--goal' : ''}`}>
          <Icon name={icon} size={28} strokeWidth={2.4} />
        </span>
        <span className="bd__entry-text">
          <strong>{goal ? goal.name : 'Monthly Savings'}</strong>
          <span>{out ? 'Withdrawal' : goal ? 'Goal Contribution' : 'To Savings Account'}</span>
        </span>
        <span className="bd__entry-right">
          <strong className={out ? 'bd__neg' : 'bd__pos'}>
            {out ? '-' : '+'}
            {formatMoney(Math.abs(e.amount), currency)}
          </strong>
          <span>{formatShortDate(e.dateISO)}</span>
        </span>
      </div>
    );
  }

  let body: ReactNode;

  if (view === 'main') {
    body = (
      <>
        <Header title="Budget" subtitle={formatMonthLabel(monthKey)} onBack={back} onMore={() => { hapticTap(); setView('settings'); }} />

        {isLight ? (
          <>
            <section className="bd__card bd__ring-card">
              <Ring value={usedPct} />
              <div className="bd__ring-list">
                <div>
                  <span>Monthly Budget</span>
                  <strong>{formatMoney(available, currency)}</strong>
                </div>
                <div>
                  <span>Spent</span>
                  <strong>{formatMoney(totalSpent, currency)}</strong>
                </div>
                <div>
                  <span>{remaining < 0 ? 'Over by' : 'Remaining'}</span>
                  <strong className={`bd__ring-remaining ${remaining < 0 ? 'bd__neg' : 'bd__pos'}`}>{formatMoney(Math.abs(remaining), currency)}</strong>
                </div>
              </div>
            </section>
            {rolloverAmount > 0 && <span className="bd__rollover">Includes {formatMoney(rolloverAmount, currency)} rolled over</span>}
            {available <= 0 && (
              <button type="button" className="bd__setup" onClick={() => setSheet({ kind: 'monthly' })}>
                Set your monthly budget
              </button>
            )}
            <div className="bd__mini-stats">
              <div className="bd__mini">
                <span className="bd__mini-tile"><img src={GOAL_ART.calendar} alt="" /></span>
                <span><strong>{daysLeft}</strong><small>Days Left</small></span>
              </div>
              <div className={`bd__mini${formatMoney(dailyAverage, currency).length > 9 ? ' bd__mini--long' : ''}`}>
                <span className="bd__mini-tile"><img src={ART.chart} alt="" /></span>
                <span><strong>{formatMoney(dailyAverage, currency)}</strong><small>Daily Average</small></span>
              </div>
              <div className="bd__mini">
                <span className="bd__mini-tile"><img src={GOAL_ART.document} alt="" /></span>
                <span><strong>{monthExpenses}</strong><small>{monthExpenses === 1 ? 'Transaction' : 'Transactions'}</small></span>
              </div>
            </div>
          </>
        ) : (
          <section className="bd__card bd__overview">
            <span className="bd__label">Monthly Budget</span>
            <strong className="bd__big">{formatMoney(available, currency)}</strong>
            {rolloverAmount > 0 && <span className="bd__rollover">Includes {formatMoney(rolloverAmount, currency)} rolled over</span>}
            <div className="bd__overview-bar">
              <Bar value={pct(totalSpent, available)} color={remaining < 0 ? 'var(--red)' : 'linear-gradient(90deg, #2f80ff, #3a8dff)'} />
              <span>{Math.round(available > 0 ? (totalSpent / available) * 100 : 0)}%</span>
            </div>
            <div className="bd__stats">
              <div>
                <span>Spent</span>
                <strong>{formatMoney(totalSpent, currency)}</strong>
              </div>
              <div>
                <span>{remaining < 0 ? 'Over by' : 'Remaining'}</span>
                <strong className={remaining < 0 ? 'bd__neg' : 'bd__pos'}>{formatMoney(Math.abs(remaining), currency)}</strong>
              </div>
              <div>
                <span>Days Left</span>
                <strong>{daysLeft}</strong>
              </div>
            </div>
            {available <= 0 && (
              <button type="button" className="bd__setup" onClick={() => setSheet({ kind: 'monthly' })}>
                Set your monthly budget
              </button>
            )}
          </section>
        )}

        <button type="button" className="bd__savings" onClick={() => { hapticTap(); setView('savings'); }}>
          <span className="bd__savings-tile">
            <img src={ART.piggyGreen} alt="" />
          </span>
          <span className="bd__savings-text">
            <strong>
              Savings <Icon name="chevron-right" size={15} strokeWidth={2.4} />
            </strong>
            <span>{formatMoney(savedThisMonth, currency)} this month</span>
          </span>
          <span className="bd__savings-right">
            <strong>{formatMoney(totalSaved, currency)}</strong>
            <span>Total Saved</span>
          </span>
        </button>

        <SectionHead title="Category Budgets" onSeeAll={() => setView('categories')} />
        <div className="bd__list">{EXPENSE_CATEGORIES.slice(0, 6).map(categoryRow)}</div>
        {isLight && (
          <button type="button" className="bd__add-cat" onClick={() => { hapticTap(); setView('categories'); }}>
            <span className="bd__add-cat-plus">
              <Icon name="plus" size={15} strokeWidth={3} />
            </span>
            Add Category Budget
          </button>
        )}
      </>
    );
  } else if (view === 'categories') {
    body = (
      <>
        <Header title="Category Budgets" onBack={goBack} />
        <p className="bd__note">Tap a category to set its monthly limit.</p>
        <div className="bd__list">{EXPENSE_CATEGORIES.map(categoryRow)}</div>
      </>
    );
  } else if (view === 'savings') {
    body = (
      <>
        <Header title="Savings" onBack={goBack} onMore={() => { hapticTap(); setSheet({ kind: 'savingsMenu' }); }} />

        <button type="button" className="bd__total" onClick={() => { hapticTap(); setSheet({ kind: 'addSavings', goalId: null }); }}>
          <img className="bd__total-piggy" src={ART.piggy} alt="" />
          <span className="bd__total-text">
            <span>Total Savings</span>
            <strong>{formatMoney(totalSaved, currency)}</strong>
            <em>
              <i className="bd__tri" /> +{formatMoney(Math.max(0, savedThisMonth), currency)} <span>this month</span>
            </em>
          </span>
        </button>

        <div className="bd__stat-cards">
          <button type="button" className="bd__stat-card" onClick={() => { hapticTap(); setSheet({ kind: 'allocation' }); }}>
            <span className="bd__stat-tile bd__stat-tile--red">
              <img src={ART.target} alt="" />
            </span>
            <span className="bd__stat-text">
              <small>Monthly Allocation</small>
              <strong>{formatMoney(prefs.savingsAllocation, currency)}</strong>
              <small>{Math.round(pct(prefs.savingsAllocation, monthlyBase))}% of budget</small>
            </span>
          </button>
          <div className="bd__stat-card">
            <span className="bd__stat-tile bd__stat-tile--blue">
              <img src={ART.chart} alt="" />
            </span>
            <span className="bd__stat-text">
              <small>Total Goals</small>
              <strong>{goals.length}</strong>
              <small>{goalsOnTrack} on track</small>
            </span>
          </div>
        </div>

        <SectionHead title="Savings Goals" onSeeAll={goals.length > 0 ? () => setView('goals') : undefined} />
        {goals.length > 0 && <div className="bd__list">{goals.slice(0, 2).map(goalRow)}</div>}

        <button type="button" className="bd__add-goal" onClick={() => { hapticTap(); setSheet({ kind: 'newGoal' }); }}>
          <span className="bd__add-plus">
            <Icon name="plus" size={17} strokeWidth={3} />
          </span>
          Add Savings Goal
        </button>

        <SectionHead title="Recent Savings" onSeeAll={recent.length > 0 ? () => setView('history') : undefined} />
        {recent.length === 0 ? (
          <p className="bd__note">Nothing saved yet. Tap Total Savings to add money.</p>
        ) : (
          <div className="bd__entries">{recent.slice(0, 2).map(entryRow)}</div>
        )}
      </>
    );
  } else if (view === 'goals') {
    body = (
      <>
        <Header title="Savings Goals" onBack={goBack} />
        <div className="bd__list">{goals.map(goalRow)}</div>
      </>
    );
  } else if (view === 'history') {
    body = (
      <>
        <Header title="Recent Savings" onBack={goBack} />
        <div className="bd__entries">{recent.map(entryRow)}</div>
      </>
    );
  } else {
    const savingsAlloc = prefs.savingsAllocation;
    const unallocated = Math.max(0, monthlyBase - categoryTotal - savingsAlloc);
    const base = Math.max(monthlyBase, categoryTotal + savingsAlloc) || 1;
    const rows: { label: string; icon: IconName; img?: string; tone?: 'blue'; danger?: boolean; onClick: () => void }[] = [
      { label: 'Edit Category Budgets', icon: 'sliders', tone: 'blue', onClick: () => setView('categories') },
      { label: 'Savings Settings', icon: 'wallet', img: ART.piggyGreen, onClick: () => setSheet({ kind: 'allocation' }) },
      { label: 'Budget Alerts', icon: 'bell', tone: 'blue', onClick: () => setSheet({ kind: 'alerts' }) },
      { label: 'Month Rollover', icon: 'calendar', onClick: () => setSheet({ kind: 'rollover' }) },
      { label: 'Reset Budget', icon: 'refresh', tone: 'blue', onClick: () => setSheet({ kind: 'reset' }) },
      { label: 'Delete Budget', icon: 'trash', danger: true, onClick: () => setSheet({ kind: 'delete' }) },
    ];
    const allocRows = [
      { label: 'Category Budgets', value: categoryTotal, color: '#3889fe' },
      { label: 'Savings', value: savingsAlloc, color: '#31e0a9' },
      { label: 'Unallocated', value: unallocated, color: '#9b5cf6' },
    ];
    body = (
      <>
        <Header title="Budget Settings" onBack={goBack} onMore={() => { hapticTap(); setSheet({ kind: 'currency' }); }} />

        <button type="button" className="bd__card bd__monthly" onClick={() => { hapticTap(); setSheet({ kind: 'monthly' }); }}>
          <span className="bd__monthly-tile">
            <img src={ART.wallet} alt="" />
          </span>
          <span className="bd__monthly-text">
            <span>Monthly Budget</span>
            <strong>{formatMoney(monthlyBase, currency)}</strong>
          </span>
          <Icon name="chevron-right" size={20} className="bd__chev" />
        </button>

        <section className="bd__card bd__alloc">
          <h2>Monthly Allocation Overview</h2>
          <div className="bd__alloc-bar">
            {allocRows.map((r) => (
              <span key={r.label} style={{ width: `${(r.value / base) * 100}%`, background: r.color }} />
            ))}
          </div>
          {allocRows.map((r) => (
            <div key={r.label} className="bd__alloc-row">
              <i style={{ background: r.color }} />
              <span>{r.label}</span>
              <b>{formatMoney(r.value, currency)}</b>
              <em>{Math.round((r.value / base) * 100)}%</em>
            </div>
          ))}
        </section>

        <section className="bd__card bd__menu-card">
          {rows.map((r) => (
            <button key={r.label} type="button" className={`bd__menu-row${r.danger ? ' bd__menu-row--danger' : ''}${r.tone ? ` bd__menu-row--${r.tone}` : ''}`} onClick={() => { hapticTap(); r.onClick(); }}>
              {r.img ? (
                <img className="bd__menu-img" src={r.img} alt="" />
              ) : (
                <Icon name={r.icon} size={27} strokeWidth={2.1} className={r.icon === 'bell' ? 'bd__icon-filled' : undefined} />
              )}
              <span>{r.label}</span>
              <Icon name="chevron-right" size={18} className="bd__chev" />
            </button>
          ))}
        </section>
      </>
    );
  }

  const openGoal = sheet?.kind === 'goal' ? goals.find((g) => g.id === sheet.goalId) : undefined;

  return (
    <div className="screen bd">
      {body}

      {sheet?.kind === 'monthly' && (
        <AmountSheet
          title="Monthly Budget"
          hint="Your total spending budget for each month. Leave it empty to use the sum of your category budgets."
          initial={prefs.monthlyBudget}
          currency={currency}
          onSave={(v) => { updatePrefs({ monthlyBudget: v }); close(); }}
          onClose={close}
        />
      )}
      {sheet?.kind === 'allocation' && (
        <AmountSheet
          title="Savings Settings"
          hint="How much you plan to put into savings each month."
          initial={prefs.savingsAllocation}
          currency={currency}
          onSave={(v) => { updatePrefs({ savingsAllocation: v }); close(); }}
          onClose={close}
        />
      )}
      {sheet?.kind === 'alerts' && (
        <AlertsSheet
          enabled={prefs.alertsEnabled}
          threshold={prefs.alertThresholdPct}
          onSave={(on, t) => { updatePrefs({ alertsEnabled: on, alertThresholdPct: t }); close(); }}
          onClose={close}
        />
      )}
      {sheet?.kind === 'rollover' && (
        <RolloverSheet enabled={prefs.rollover} onSave={(on) => { updatePrefs({ rollover: on }); close(); }} onClose={close} />
      )}
      {sheet?.kind === 'reset' && (
        <ConfirmSheet
          title="Reset Budget"
          message="Clears your monthly budget and every category budget. Your savings and expenses are kept."
          confirmLabel="Reset"
          onConfirm={() => { hapticWarning(); persist([]); updatePrefs({ monthlyBudget: 0 }); close(); }}
          onClose={close}
        />
      )}
      {sheet?.kind === 'delete' && (
        <ConfirmSheet
          title="Delete Budget"
          message="Deletes all budgets, savings goals and savings history. Expenses in Expense Tracker are not touched. This can't be undone."
          confirmLabel="Delete everything"
          onConfirm={() => {
            hapticWarning();
            persist([]);
            updateGoals([]);
            updateEntries([]);
            updatePrefs({ monthlyBudget: 0, savingsAllocation: 0, rollover: false });
            close();
            setView('main');
          }}
          onClose={close}
        />
      )}
      {sheet?.kind === 'currency' && (
        <CurrencySheet
          currency={currency}
          onSelect={(code) => { hapticTap(); setCurrency(code); storageSet(StorageKeys.budgetDefaultCurrency, code); close(); }}
          onClose={close}
        />
      )}
      {sheet?.kind === 'newGoal' && (
        <GoalEditorSheet
          currency={currency}
          onSave={(g) => { updateGoals([...goals, { id: newId(), createdAt: Date.now(), ...g }]); close(); }}
          onClose={close}
        />
      )}
      {openGoal && (
        <GoalSheet
          goal={openGoal}
          saved={savedForGoal(openGoal.id)}
          currency={currency}
          onAdd={(v) => { addEntry(v, openGoal.id); close(); }}
          onWithdraw={(v) => { addEntry(-v, openGoal.id); close(); }}
          onDelete={() => {
            hapticWarning();
            updateGoals(goals.filter((g) => g.id !== openGoal.id));
            updateEntries(entries.filter((e) => e.goalId !== openGoal.id));
            close();
          }}
          onClose={close}
        />
      )}
      {sheet?.kind === 'addSavings' && (
        <AddSavingsSheet
          goals={goals}
          currency={currency}
          initialGoalId={sheet.goalId}
          onSave={(v, goalId) => { addEntry(v, goalId); close(); }}
          onClose={close}
        />
      )}
      {sheet?.kind === 'savingsMenu' && (
        <MenuSheet
          title="Savings"
          onClose={close}
          items={[
            { label: 'Add to savings', icon: 'plus', onClick: () => setSheet({ kind: 'addSavings', goalId: null }) },
            { label: 'New savings goal', icon: 'target', onClick: () => setSheet({ kind: 'newGoal' }) },
            { label: 'Savings settings', icon: 'sliders', onClick: () => setSheet({ kind: 'allocation' }) },
          ]}
        />
      )}
    </div>
  );
}
