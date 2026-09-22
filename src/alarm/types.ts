export type RepeatMode = 'today' | 'daily' | 'weekend' | 'weekdays';

export type TimeCategory = 'morning' | 'afternoon' | 'evening' | 'night';

export interface AlarmPreset {
  hour: number;
  minute: number;
}

export type AlarmPresets = Record<TimeCategory, AlarmPreset[]>;

export const DEFAULT_PRESETS: AlarmPresets = {
  morning: [
    { hour: 5, minute: 0 },
    { hour: 6, minute: 0 },
    { hour: 7, minute: 0 },
    { hour: 8, minute: 0 },
  ],
  afternoon: [
    { hour: 12, minute: 0 },
    { hour: 13, minute: 0 },
    { hour: 14, minute: 0 },
  ],
  evening: [
    { hour: 16, minute: 0 },
    { hour: 17, minute: 0 },
    { hour: 18, minute: 0 },
  ],
  night: [
    { hour: 22, minute: 0 },
    { hour: 23, minute: 0 },
    { hour: 0, minute: 0 },
  ],
};

export const REPEAT_LABELS: Record<RepeatMode, string> = {
  today: 'Today',
  daily: 'Daily',
  weekend: 'Weekends',
  weekdays: 'Weekdays',
};

export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${period}`;
}
