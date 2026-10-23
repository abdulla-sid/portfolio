import { contact } from '../../content/site';
import { getSkin } from '../skin';
import { type Card, check, post, room } from './contact';
import { turnstile } from './turnstile';

const WAIT_FOR_CHECK = 6000; // ms a Post it click waits for Turnstile's token before asking to try again
const NEAR = 0.9; // the room line warns from this share of the limit

/** Wires the contact postcard: checks the card, waits for the bot check, posts it, and shows how it went. */
export function mountPostcard(form: HTMLFormElement): void {
  const status = form.querySelector<HTMLElement>('[data-status]');
  const label = form.querySelector<HTMLElement>('[data-send-label]');
  const fields = form.querySelector('fieldset');
  const slot = form.querySelector<HTMLElement>('[data-captcha]');
  const meter = form.querySelector<HTMLElement>('[data-room]');
  const words = form.querySelector<HTMLElement>('[data-room-words]');
  const message = form.querySelector('textarea');
  if (!status || !label || !fields || !slot || !meter || !words || !message) return;
  const showRoom = () => {
    const { share, line } = room(message.value.length, contact.card.room);
    meter.style.setProperty('--fill', String(share));
    meter.toggleAttribute('data-near', share >= NEAR);
    if (line && words.textContent !== line.say) words.textContent = line.say;
  };
  const say = (line: string) => {
    status.textContent = line;
  };
  // the card can't be edited while it is posting, or once it has gone
  const setState = (state?: 'sending' | 'sent') => {
    if (state) form.dataset.state = state;
    else delete form.dataset.state;
    fields.disabled = !!state;
  };

  let token = '';
  let wake: (() => void) | undefined;
  // undefined: not started; null: it couldn't start, so the postbox is closed
  let check$: Promise<{ reset(): void } | null> | undefined;
  const startCheck = () => {
    check$ ??= turnstile(slot, getSkin().mode === 'pixel' ? 'dark' : 'light', (t) => {
      token = t;
      if (t) wake?.();
    }).catch(() => null);
    return check$;
  };
  const tokenWithin = (ms: number) =>
    token
      ? Promise.resolve(token)
      : new Promise<string>((resolve) => {
          wake = () => resolve(token);
          setTimeout(() => resolve(token), ms);
        });

  // the bot check loads once someone starts writing, not with the page
  form.addEventListener('focusin', startCheck, { once: true });
  form.addEventListener('input', () => {
    if (form.dataset.state !== 'sending') say('');
    showRoom();
  });

  const again = () => {
    setState();
    form.reset();
    showRoom();
    label.textContent = contact.card.send;
    say('');
    message.focus();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.dataset.state === 'sending') return;
    if (form.dataset.state === 'sent') return again();

    const card = Object.fromEntries(new FormData(form)) as unknown as Card;
    const problem = check(card);
    if (problem) {
      say(contact.status[problem]);
      form.querySelector<HTMLElement>(`[name="${problem === 'emailShape' ? 'email' : problem}"]`)?.focus();
      return;
    }
    const guard = await startCheck();
    if (!guard) return say(contact.status.closed);

    setState('sending');
    say(contact.status.sending);
    const pass = await tokenWithin(WAIT_FOR_CHECK);
    if (!pass) {
      setState();
      return say(contact.status.checking);
    }
    try {
      await post(card, pass);
      setState('sent');
      label.textContent = contact.card.again;
      say(contact.status.sent.replace('{email}', card.email.trim()));
    } catch {
      setState();
      say(contact.status.failed);
    }
    // a token is good for one post
    guard.reset();
  });
}
