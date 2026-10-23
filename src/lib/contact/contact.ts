/** The postcard's fields, as the contact Pages Function (functions/api/contact.ts) takes them. */
export interface Card {
  name: string;
  email: string;
  track: string;
  message: string;
  /** The honeypot: people never see it, so anything in it came from a bot. */
  website: string;
}

/** Why a card can't be posted yet; each key is a line in content/site.ts `contact.status`. */
export type Problem = 'name' | 'email' | 'emailShape' | 'message' | 'tooLong';

// the function imports these too, so a card that passes here passes there
export const LIMITS = { name: 100, email: 254, track: 120, message: 1000 } as const;
export const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function check(card: Card): Problem | null {
  const [name, email, message] = [card.name.trim(), card.email.trim(), card.message.trim()];
  if (!message) return 'message';
  if (!name) return 'name';
  if (!email) return 'email';
  if (!EMAIL_SHAPE.test(email)) return 'emailShape';
  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    card.track.trim().length > LIMITS.track ||
    message.length > LIMITS.message
  )
    return 'tooLong';
  return null;
}

/** How full the card is: the share of the message limit used (0 to 1), and which room line applies. */
export function room<T extends { from: number }>(
  length: number,
  lines: readonly T[],
): { share: number; line: T | undefined } {
  const share = Math.min(1, length / LIMITS.message);
  return { share, line: lines.findLast((l) => share >= l.from) };
}

/** Posts the card; resolves when the function says it was delivered. */
export async function post(card: Card, turnstileToken: string): Promise<void> {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...card, turnstileToken }),
  });
  if (!res.ok) throw new Error(`contact: ${res.status}`);
}
