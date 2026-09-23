import { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import { hapticSelect } from '../../haptics';
import { parseISODate, toISODate } from './dateMath';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface CalendarPickerProps {
  selectedISO: string;
  onSelect: (iso: string) => void;
  accentColor?: string;
}

export function CalendarPicker({ selectedISO, onSelect, accentColor }: CalendarPickerProps) {
  const selected = parseISODate(selectedISO);
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());

  useEffect(() => {
    if (selected) setViewDate(selected);
  }, [selectedISO]); // eslint-disable-line react-hooks/exhaustive-deps

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function shiftMonth(delta: number) {
    hapticSelect();
    setViewDate(new Date(year, month + delta, 1));
  }

  function pickDay(day: number) {
    hapticSelect();
    onSelect(toISODate(new Date(year, month, day)));
  }

  return (
    <div className="cal" style={accentColor ? ({ '--cal-accent': accentColor } as React.CSSProperties) : undefined}>
      <div className="cal__header">
        <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          <Icon name="chevron-right" size={16} className="cal__prev-icon" />
        </button>
        <strong>
          {MONTH_NAMES[month]} {year}
        </strong>
        <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
      <div className="cal__weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="cal__grid">
        {cells.map((day, i) => {
          if (day === null) return <span key={`blank-${i}`} />;
          const iso = toISODate(new Date(year, month, day));
          const isSelected = iso === selectedISO;
          return (
            <button
              key={day}
              type="button"
              className={`cal__day${isSelected ? ' cal__day--selected' : ''}`}
              onClick={() => pickDay(day)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
