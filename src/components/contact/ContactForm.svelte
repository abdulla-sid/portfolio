<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import {
    litSegments,
    MESSAGE_LIMIT,
    send,
    TRACK_LIMIT,
    validate,
  } from "./contact";
  import {
    loadTurnstile,
    turnstileSiteKey,
    type TurnstileApi,
  } from "./turnstile";

  type SubmitPhase = "idle" | "sending" | "sent";
  type ChallengeState = "waiting" | "unavailable" | "failed";

  const CHALLENGE_TEXT: Record<ChallengeState, string> = {
    waiting: "OPENING SIGNAL",
    unavailable: "NO SIGNAL — CANNOT SEND",
    failed: "SIGNAL LOST — TRY AGAIN",
  };

  const METER_SEGMENTS = 14;
  const METER_HOT_FROM = 10;
  const SEGMENTS = [...Array(METER_SEGMENTS).keys()];

  let name = $state("");
  let email = $state("");
  let track = $state("");
  let message = $state("");
  let website = $state("");
  let phase = $state<SubmitPhase>("idle");
  let error = $state<string | null>(null);
  let challenge = $state<ChallengeState>("waiting");
  let nudged = $state(false);
  let turnstileToken = $state("");
  let challengeEl = $state<HTMLDivElement>();
  let turnstile: TurnstileApi | undefined;
  let widgetId: string | number | undefined;
  let request: AbortController | undefined;
  let mounted = true;

  const lit = $derived(litSegments(message.length, METER_SEGMENTS));

  const signal = $derived(
    error ??
      (phase === "sending"
        ? "TRANSMITTING"
        : turnstileToken
          ? "SIGNAL OPEN"
          : nudged && challenge === "waiting"
            ? "OPENING SIGNAL — HOLD ON"
            : CHALLENGE_TEXT[challenge]),
  );

  const alerting = $derived(Boolean(error) || challenge === "failed" || nudged);

  async function renderChallenge() {
    const sitekey = turnstileSiteKey();
    if (!sitekey) {
      challenge = "unavailable";
      return;
    }
    try {
      const api = await loadTurnstile();
      if (!mounted || !challengeEl || widgetId !== undefined) return;
      turnstile = api;
      widgetId = api.render(challengeEl, {
        sitekey,
        appearance: "interaction-only",
        theme: "dark",
        callback: (token) => {
          turnstileToken = token;
          challenge = "waiting";
          nudged = false;
        },
        "expired-callback": () => {
          turnstileToken = "";
          challenge = "waiting";
          if (widgetId !== undefined) api.reset(widgetId);
        },
        "error-callback": () => {
          turnstileToken = "";
          challenge = "failed";
          return true;
        },
      });
    } catch {
      if (mounted) challenge = "unavailable";
    }
  }

  function resetChallenge() {
    turnstileToken = "";
    challenge = "waiting";
    if (turnstile && widgetId !== undefined) turnstile.reset(widgetId);
  }

  function removeChallenge() {
    if (turnstile && widgetId !== undefined) turnstile.remove(widgetId);
    widgetId = undefined;
    turnstileToken = "";
    challenge = "waiting";
  }

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (phase === "sending") return;
    const fields = { name, email, track, message, website };
    const problem = validate(fields);
    if (problem) {
      error = problem;
      return;
    }
    if (!turnstileToken) {
      nudged = true;
      return;
    }
    error = null;
    phase = "sending";
    const controller = new AbortController();
    request = controller;
    try {
      await send(fields, turnstileToken, controller.signal);
      if (!mounted || controller.signal.aborted) return;
      removeChallenge();
      phase = "sent";
    } catch {
      if (!mounted || controller.signal.aborted) return;
      phase = "idle";
      resetChallenge();
      error = "TRANSMISSION FAILED — TRY AGAIN";
    } finally {
      if (request === controller) request = undefined;
    }
  }

  async function reset() {
    name = "";
    email = "";
    track = "";
    message = "";
    website = "";
    phase = "idle";
    error = null;
    challenge = "waiting";
    nudged = false;
    await tick();
    void renderChallenge();
  }

  onMount(() => void renderChallenge());

  onDestroy(() => {
    mounted = false;
    request?.abort();
    removeChallenge();
  });
</script>

{#if phase === "sent"}
  <div class="sent" data-no-drag>
    <p class="headline">TRANSMITTED</p>
    <p>Thanks for reaching out — I'll get back to you soon.</p>
    <button type="button" onclick={reset}>SEND ANOTHER</button>
  </div>
{:else}
  <form
    data-no-drag
    novalidate
    onsubmit={onSubmit}
    oninput={() => (error = null)}
  >
    <div class="pair">
      <label>
        <span class="key">NAME</span>
        <input name="name" type="text" bind:value={name} autocomplete="name" />
      </label>
      <label>
        <span class="key">REPLY TO</span>
        <input
          name="email"
          type="email"
          bind:value={email}
          autocomplete="email"
        />
      </label>
    </div>

    <label class="track">
      <span class="key">A TRACK, IF YOU HAVE ONE — OPTIONAL</span>
      <input
        name="track"
        type="text"
        bind:value={track}
        autocomplete="off"
        maxlength={TRACK_LIMIT}
      />
    </label>

    <div class="message">
      <div class="message-head">
        <label class="key" for="contact-message">MESSAGE</label>
        <span class="gauge">
          <span class="meter" aria-hidden="true">
            {#each SEGMENTS as index (index)}
              <i class:lit={index < lit} class:hot={index >= METER_HOT_FROM}
              ></i>
            {/each}
          </span>
          <span class="count">{message.length} / {MESSAGE_LIMIT}</span>
        </span>
      </div>
      <textarea
        id="contact-message"
        name="message"
        rows="6"
        maxlength={MESSAGE_LIMIT}
        bind:value={message}></textarea>
    </div>

    <label class="website" aria-hidden="true">
      WEBSITE
      <input
        name="website"
        type="text"
        bind:value={website}
        autocomplete="off"
        tabindex="-1"
      />
    </label>

    <div
      class="challenge"
      aria-label="Security verification"
      data-ready={turnstileToken !== ""}
      bind:this={challengeEl}
    ></div>

    <div class="rail">
      <span class="signal" class:alerting>
        <i class="lamp"></i>
        <span role={alerting ? "alert" : undefined}>{signal}</span>
      </span>
      <button type="submit" disabled={phase === "sending"}>
        {phase === "sending" ? "SENDING…" : "TRANSMIT"}
      </button>
    </div>
  </form>
{/if}

<style>
  form,
  .sent {
    --field-gap: var(--panel-gap, 22px);
    color: var(--ui-accent);
    font: inherit;
  }

  form {
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    gap: var(--field-gap);
    min-width: 0;
    min-height: 0;
  }

  .pair {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--field-gap) 34px;
    min-width: 0;
  }

  @container contact-form (max-width: 480px) {
    .pair {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @container contact-form (max-width: 300px) {
    .count {
      display: none;
    }
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  .key {
    font-size: 8px;
    letter-spacing: 1px;
    color: var(--text-muted);
  }

  input,
  textarea {
    border: 0;
    background: none;
    color: var(--ui-accent);
    font: inherit;
    font-size: 11px;
    line-height: 1.6;
    min-width: 0;
  }

  input {
    border-bottom: 2px solid var(--ui-accent-deep);
    padding: 9px 12px 10px;
  }

  @container contact-form (max-width: 480px) {
    input {
      padding: 5px 10px 7px;
    }
  }

  .message {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    min-height: 0;
  }

  .message-head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
  }

  .gauge {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: auto;
    white-space: nowrap;
  }

  textarea {
    flex: 1;
    min-height: 0;
    padding: 14px 16px;
    background: var(--contact-surface);
    resize: none;
  }

  input:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--ui-highlight);
    outline-offset: -2px;
  }

  input:focus-visible {
    border-bottom-color: var(--ui-accent);
  }

  .website {
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .challenge:not(:empty) {
    margin-top: calc(-1 * var(--field-gap) / 2);
  }

  .rail {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    min-width: 0;
  }

  .meter {
    display: flex;
    gap: 3px;
  }

  .meter i {
    display: block;
    width: 9px;
    height: 12px;
    background: var(--contact-meter);
  }

  .meter i.lit {
    background: var(--ui-accent);
  }

  .meter i.lit.hot {
    background: var(--contact-meter-hot);
  }

  .count {
    font-size: 8px;
    letter-spacing: 1px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  .signal {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
    font-size: 8px;
    letter-spacing: 1px;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .lamp {
    width: 10px;
    height: 10px;
    background: var(--ui-accent-deep);
  }

  .signal.alerting {
    color: var(--ui-highlight);
  }

  .signal.alerting .lamp {
    background: var(--contact-alert);
  }

  button {
    border: 2px solid var(--ui-accent);
    background: var(--ui-accent);
    padding: 12px 24px;
    color: var(--ui-ink);
    font: inherit;
    font-size: 10px;
    letter-spacing: 1px;
    cursor: pointer;
  }

  button:disabled {
    background: none;
    border-color: var(--ui-accent-deep);
    color: var(--ui-accent-deep);
    cursor: default;
  }

  button:focus-visible {
    outline: 2px solid var(--ui-highlight);
    outline-offset: -4px;
  }

  .sent {
    display: flex;
    flex-direction: column;
    gap: var(--field-gap);
    max-width: 640px;
  }

  .sent .headline {
    color: var(--ui-highlight);
    letter-spacing: 1px;
  }

  .sent button {
    align-self: flex-start;
  }

  @media (max-width: 900px) {
    form,
    .sent {
      --field-gap: 12px;
      font-size: 9px;
    }

    /*
     * The message row is a 1fr track on desktop so the textarea fills the
     * panel. On a phone the textarea carries a 96px floor instead, which a
     * shrinking track cannot honour — it overflowed its own row and covered
     * the send button. The panel body scrolls here, so let the rows size to
     * their content and flow instead.
     */
    form {
      grid-template-rows: auto auto auto auto;
    }

    .pair {
      grid-template-columns: minmax(0, 1fr);
    }

    label {
      gap: 6px;
    }

    input,
    textarea {
      min-height: 44px;
      font-size: 16px;
    }

    textarea {
      min-height: 96px;
      padding: 10px 12px;
    }

    .rail {
      flex-wrap: wrap;
    }

    .rail button {
      width: 100%;
      min-height: 44px;
      font-size: 9px;
    }

    .signal {
      margin-left: 0;
    }
  }
</style>
