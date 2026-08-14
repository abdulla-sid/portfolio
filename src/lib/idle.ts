const FALLBACK_DELAY_MS = 1500;
const IDLE_TIMEOUT_MS = 4000;

export function whenIdle(task: () => void): void {
  const request = globalThis.requestIdleCallback;
  if (request) request(() => task(), { timeout: IDLE_TIMEOUT_MS });
  else globalThis.setTimeout(task, FALLBACK_DELAY_MS);
}
