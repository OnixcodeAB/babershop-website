import type { UpcomingDay } from '../lib';

interface DayGridProps {
  days: UpcomingDay[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

export function DayGrid({ days, selectedDate, onSelect }: DayGridProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-7">
      {days.map((day) => {
        const isSelected = day.inputValue === selectedDate;
        return (
          <button
            type="button"
            key={day.inputValue}
            onClick={() => onSelect(day.inputValue)}
            className={`rounded-xl border px-3 py-4 text-center text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isSelected ? 'border-emerald-500 bg-emerald-500/20 text-emerald-100' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">{day.weekdayLabel}</span>
            <span className="mt-1 block text-lg font-semibold text-white">{day.dayNumber}</span>
            <span className="mt-1 block text-xs text-slate-400">{day.monthLabel}</span>
            {day.isToday ? <span className="mt-1 block text-[10px] uppercase text-emerald-300">Today</span> : null}
          </button>
        );
      })}
    </div>
  );
}
