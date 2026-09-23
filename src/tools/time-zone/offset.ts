export function getOffsetMinutes(timeZone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

export function formatOffsetDiff(cityTimeZone: string, now: Date): string {
  const localOffset = -now.getTimezoneOffset();
  const cityOffset = getOffsetMinutes(cityTimeZone, now);
  const diff = Math.round(cityOffset - localOffset);
  if (diff === 0) return 'Same time as you';
  const hours = Math.floor(Math.abs(diff) / 60);
  const mins = Math.abs(diff) % 60;
  const sign = diff > 0 ? '+' : '-';
  const parts = [hours ? `${hours}h` : '', mins ? `${mins}m` : ''].filter(Boolean).join(' ');
  return `${sign}${parts} vs you`;
}

/** Whole-hour offset used only for sorting cities west-to-east. */
export function offsetHoursForSort(timeZone: string, now: Date): number {
  return getOffsetMinutes(timeZone, now) / 60;
}

/** null when same calendar day as local; otherwise "Yesterday" / "Tomorrow" / "+2d" / "-2d". */
export function dayOffsetLabel(timeZone: string, at: Date): string | null {
  const localYMD = at.toLocaleDateString('en-CA');
  const cityYMD = at.toLocaleDateString('en-CA', { timeZone });
  if (localYMD === cityYMD) return null;
  const diffDays = Math.round((new Date(`${cityYMD}T00:00:00`).getTime() - new Date(`${localYMD}T00:00:00`).getTime()) / 86400000);
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return diffDays > 0 ? `+${diffDays}d` : `${diffDays}d`;
}

export type DayPeriod = 'sunrise' | 'sun' | 'sunset' | 'moon';

/** A rough sun/moon icon for a city's current local hour — not real sunrise/sunset data. */
export function dayPeriod(timeZone: string, at: Date): DayPeriod {
  const raw = Number(at.toLocaleString('en-US', { timeZone, hour: 'numeric', hour12: false }));
  const hour = raw === 24 ? 0 : raw;
  if (hour >= 6 && hour < 8) return 'sunrise';
  if (hour >= 8 && hour < 18) return 'sun';
  if (hour >= 18 && hour < 20) return 'sunset';
  return 'moon';
}

export function hourInZone(timeZone: string, at: Date): number {
  const raw = Number(at.toLocaleString('en-US', { timeZone, hour: 'numeric', hour12: false }));
  return raw === 24 ? 0 : raw;
}

/** The real instant that is `hour`:00 wall-clock time in `timeZone`, on the same calendar day (in that zone) as `baseDate`. */
export function instantAtHourInZone(timeZone: string, hour: number, baseDate: Date): Date {
  const ymd = baseDate.toLocaleDateString('en-CA', { timeZone });
  const [y, m, d] = ymd.split('-').map(Number);
  const offsetMinutes = getOffsetMinutes(timeZone, baseDate);
  return new Date(Date.UTC(y, m - 1, d, hour, 0, 0) - offsetMinutes * 60000);
}
