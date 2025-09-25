const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const calendarWeekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
});

const calendarMonthFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatTimeRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
}

export function formatDateTime(dateIso: string) {
  return dateTimeFormatter.format(new Date(dateIso));
}

export function formatDateLabel(dateInput: string) {
  const [year, month, day] = dateInput.split('-').map(Number);
  if ([year, month, day].some((value) => Number.isNaN(value))) {
    return dateInput;
  }

  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return dateFormatter.format(date);
}

export function formatCalendarWeekday(date: Date) {
  return calendarWeekdayFormatter.format(date);
}

export function formatCalendarMonth(date: Date) {
  return calendarMonthFormatter.format(date);
}
