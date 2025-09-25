import { formatCalendarMonth, formatCalendarWeekday } from '../../../shared/format';

export type UpcomingDay = {
  dayNumber: number;
  inputValue: string;
  isToday: boolean;
  monthLabel: string;
  weekdayLabel: string;
};

export function toDateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().split('T')[0];
}

export function buildUpcomingDays(count = 7): UpcomingDay[] {
  const days: UpcomingDay[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < count; offset += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + offset);

    days.push({
      dayNumber: current.getDate(),
      inputValue: toDateInputValue(current),
      isToday: offset === 0,
      monthLabel: formatCalendarMonth(current),
      weekdayLabel: formatCalendarWeekday(current),
    });
  }

  return days;
}
