interface ClockParts {
  hh: string;
  mm: string;
  weekday: string;
  day: string;
  month: string;
}

// Building an Intl formatter is slow and the LCD reads the clock 8 times a second, so keep one per zone.
const cached = new Map<string, Intl.DateTimeFormat>();
function formatter(key: string, make: () => Intl.DateTimeFormat): Intl.DateTimeFormat {
  let fmt = cached.get(key);
  if (!fmt) {
    fmt = make();
    cached.set(key, fmt);
  }
  return fmt;
}

/** Hours, minutes and date of `date` in a time zone, 24-hour, English names. */
export function clockParts(date: Date, timeZone: string): ClockParts {
  const parts = formatter(
    `parts ${timeZone}`,
    () =>
      new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hourCycle: 'h23',
      }),
  ).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    hh: get('hour'),
    mm: get('minute'),
    weekday: get('weekday'),
    day: get('day'),
    month: get('month'),
  };
}

/** The UTC offset of a time zone as "UTC+5" or "UTC-3:30". */
export function utcOffset(date: Date, timeZone: string): string {
  const name =
    formatter(
      `offset ${timeZone}`,
      () => new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' }),
    )
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  return name.replace('GMT', 'UTC').replace(/^UTC$/, 'UTC+0');
}

/** The time on a wall clock in a time zone, as "HH:MM" plus the hour for logic. */
export function clockIn(timeZone: string, date = new Date()): { time: string; hour: number } {
  const { hh, mm } = clockParts(date, timeZone);
  return { time: `${hh}:${mm}`, hour: Number(hh) };
}

/** Between 1am and 9am he is asleep; any other hour, at his desk. */
export const isAsleep = (hour: number): boolean => hour >= 1 && hour < 9;
