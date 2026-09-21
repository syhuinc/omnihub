export interface AgeBreakdown {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

export function parseISODate(iso: string): Date | null {
  if (!iso) return null;
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ageBreakdown(birth: Date, asOf: Date): AgeBreakdown {
  let years = asOf.getFullYear() - birth.getFullYear();
  let months = asOf.getMonth() - birth.getMonth();
  let days = asOf.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(asOf.getFullYear(), asOf.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.round((asOf.getTime() - birth.getTime()) / 86400000);
  return { years, months, days, totalDays };
}

export function nextBirthday(birth: Date, asOf: Date): { date: Date; daysUntil: number } {
  let next = new Date(asOf.getFullYear(), birth.getMonth(), birth.getDate());
  if (next.getTime() < stripTime(asOf).getTime()) {
    next = new Date(asOf.getFullYear() + 1, birth.getMonth(), birth.getDate());
  }
  const daysUntil = Math.round((next.getTime() - stripTime(asOf).getTime()) / 86400000);
  return { date: next, daysUntil };
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((stripTime(b).getTime() - stripTime(a).getTime()) / 86400000);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
