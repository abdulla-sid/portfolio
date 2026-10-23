import { describe, expect, it } from 'vitest';
import { clockIn, clockParts, isAsleep, utcOffset } from './clock';

describe('clockParts', () => {
  const date = new Date('2026-10-23T20:05:00Z');

  it('reads the clock in a time zone', () => {
    expect(clockParts(date, 'Asia/Karachi')).toEqual({
      hh: '01',
      mm: '05',
      weekday: 'Sat',
      day: '24',
      month: 'Oct',
    });
  });

  it('names the UTC offset', () => {
    expect(utcOffset(date, 'Asia/Karachi')).toBe('UTC+5');
    expect(utcOffset(date, 'UTC')).toBe('UTC+0');
    expect(utcOffset(date, 'Asia/Kolkata')).toBe('UTC+5:30');
  });
});

describe('clockIn', () => {
  it('reads the wall clock in Lahore (UTC+5, no daylight saving)', () => {
    expect(clockIn('Asia/Karachi', new Date('2026-10-23T19:05:00Z'))).toEqual({ time: '00:05', hour: 0 });
    expect(clockIn('Asia/Karachi', new Date('2026-06-01T08:30:00Z'))).toEqual({ time: '13:30', hour: 13 });
  });
});

describe('isAsleep', () => {
  it('is asleep from 1am up to 9am', () => {
    expect([0, 1, 8, 9, 23].map(isAsleep)).toEqual([false, true, true, false, false]);
  });
});
