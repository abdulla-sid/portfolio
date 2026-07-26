interface TurnstileRenderOptions {
  sitekey: string;
  appearance: "interaction-only";
  theme: "dark";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => boolean;
}

export interface TurnstileApi {
  render(
    container: HTMLElement,
    options: TurnstileRenderOptions,
  ): string | number;
  remove(widgetId: string | number): void;
  reset(widgetId: string | number): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = "cloudflare-turnstile";
const SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let pending: Promise<TurnstileApi> | undefined;

export function turnstileSiteKey(): string {
  return import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";
}

export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (pending) return pending;

  const loading = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.getElementById(
      SCRIPT_ID,
    ) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");

    const loaded = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile loaded without an API"));
    };
    const failed = () => reject(new Error("Turnstile failed to load"));

    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.append(script);
    }
  });
  pending = loading.catch((error) => {
    pending = undefined;
    throw error;
  });

  return pending;
}
