import { TURNSTILE_SITE_KEY } from 'astro:env/client';

interface Turnstile {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(id: string): void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/**
 * Cloudflare's bot check, loaded on demand into el. It stays invisible unless Cloudflare wants a click.
 * onToken gets each fresh token, and '' when one expires or the check fails. Rejects when there is no site key
 * (local dev) or the script can't load: the form can't post then.
 */
export async function turnstile(
  el: HTMLElement,
  theme: 'light' | 'dark',
  onToken: (token: string) => void,
): Promise<{ reset(): void }> {
  if (!TURNSTILE_SITE_KEY) throw new Error('turnstile: no site key');
  const api = window.turnstile ?? (await load());
  const id = api.render(el, {
    sitekey: TURNSTILE_SITE_KEY,
    appearance: 'interaction-only',
    theme,
    callback: onToken,
    'expired-callback': () => onToken(''),
    'error-callback': () => onToken(''),
  });
  return {
    reset() {
      onToken('');
      api.reset(id);
    },
  };
}

function load(): Promise<Turnstile> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile: no api'));
    script.onerror = () => reject(new Error('turnstile: failed to load'));
    document.head.append(script);
  });
}
