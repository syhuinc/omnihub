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
