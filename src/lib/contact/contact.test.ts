import { describe, expect, it } from 'vitest';
import { type Card, check, LIMITS, room } from './contact';

const card: Card = { name: 'Sara', email: 'sara@example.com', track: '', message: 'Hi!', website: '' };

describe('check', () => {
  it('passes a filled card, with or without a track', () => {
    expect(check(card)).toBeNull();
    expect(check({ ...card, track: 'Detonate' })).toBeNull();
  });

  it('asks for the message first, then who it is from, then where to reply', () => {
    expect(check({ ...card, message: '  ', name: '' })).toBe('message');
    expect(check({ ...card, name: ' ', email: '' })).toBe('name');
    expect(check({ ...card, email: '' })).toBe('email');
    expect(check({ ...card, email: 'sara@example' })).toBe('emailShape');
  });

  it('holds the same limits as the function', () => {
    expect(check({ ...card, message: 'x'.repeat(LIMITS.message) })).toBeNull();
    expect(check({ ...card, message: 'x'.repeat(LIMITS.message + 1) })).toBe('tooLong');
    expect(check({ ...card, track: 'x'.repeat(LIMITS.track + 1) })).toBe('tooLong');
  });
});

describe('room', () => {
  const lines = [
    { from: 0, say: 'plenty' },
    { from: 0.5, say: 'some' },
    { from: 1, say: 'full' },
  ];

  it('says how full the card is', () => {
    expect(room(0, lines)).toEqual({ share: 0, line: lines[0] });
    expect(room(LIMITS.message / 2, lines).line?.say).toBe('some');
    expect(room(LIMITS.message, lines)).toEqual({ share: 1, line: lines[2] });
  });
});
