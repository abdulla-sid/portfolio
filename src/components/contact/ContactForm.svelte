<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import { send, validate } from "./contact";
  import {
    loadTurnstile,
    turnstileSiteKey,
    type TurnstileApi,
  } from "./turnstile";

  type SubmitPhase = "idle" | "sending" | "sent";

  let name = $state("");
  let email = $state("");
  let message = $state("");
  let website = $state("");
  let phase = $state<SubmitPhase>("idle");
  let error = $state<string | null>(null);
  let challengeError = $state<string | null>(null);
  let turnstileToken = $state("");
  let challengeEl = $state<HTMLDivElement>();
  let turnstile: TurnstileApi | undefined;
  let widgetId: string | number | undefined;
  let request: AbortController | undefined;
  let mounted = true;

  async function renderChallenge() {
    const sitekey = turnstileSiteKey();
    if (!sitekey) {
      challengeError = "SECURITY CHECK UNAVAILABLE";
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
          challengeError = null;
        },
        "expired-callback": () => {
          turnstileToken = "";
          if (widgetId !== undefined) api.reset(widgetId);
        },
        "error-callback": () => {
          turnstileToken = "";
          challengeError = "SECURITY CHECK FAILED — TRY AGAIN";
          return true;
        },
      });
    } catch {
      if (mounted) challengeError = "SECURITY CHECK UNAVAILABLE";
    }
  }

  function resetChallenge() {
    turnstileToken = "";
    if (turnstile && widgetId !== undefined) turnstile.reset(widgetId);
  }

  function removeChallenge() {
    if (turnstile && widgetId !== undefined) turnstile.remove(widgetId);
    widgetId = undefined;
    turnstileToken = "";
  }

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (phase === "sending") return;
    const fields = { name, email, message, website };
    const problem = validate(fields);
    if (problem) {
      error = problem;
      return;
    }
    if (!turnstileToken) {
      error = challengeError ?? "SECURITY CHECK IN PROGRESS";
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
      error = "SEND FAILED — TRY AGAIN";
    } finally {
      if (request === controller) request = undefined;
    }
  }

  async function reset() {
    name = "";
    email = "";
    message = "";
    website = "";
    phase = "idle";
    error = null;
    challengeError = null;
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
    <p class="headline">MESSAGE SENT!</p>
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
    <label class="name">
      NAME
      <input name="name" type="text" bind:value={name} autocomplete="name" />
    </label>
    <label class="email">
      EMAIL
      <input
        name="email"
        type="email"
        bind:value={email}
        autocomplete="email"
      />
    </label>
    <label class="message">
      MESSAGE
      <textarea name="message" rows="6" bind:value={message}></textarea>
    </label>
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
    <div class="foot">
      {#if error ?? challengeError}
        <p class="error" role="alert">{error ?? challengeError}</p>
      {/if}
      <button type="submit" disabled={phase === "sending"}>
        {phase === "sending" ? "SENDING…" : "SEND"}
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
    --column-gap: 32px;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto minmax(0, 1fr) auto auto;
    grid-template-areas:
      "name"
      "email"
      "message"
      "challenge"
      "foot";
    gap: var(--field-gap) var(--column-gap);
    min-height: 0;
  }

  @container contact-form (min-width: 560px) {
    form {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
      grid-template-rows: auto auto minmax(0, 1fr) auto;
      grid-template-areas:
        "name      message"
        "email     message"
        "challenge message"
        "foot      foot";
    }
  }

  .sent {
    display: flex;
    flex-direction: column;
    gap: var(--field-gap);
    max-width: 640px;
  }

  .name {
    grid-area: name;
  }

  .email {
    grid-area: email;
  }

  .message {
    grid-area: message;
    min-height: 0;
  }

  .message textarea {
    flex: 1;
    min-height: 0;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    letter-spacing: 1px;
  }

  input,
  textarea {
    border: 2px solid var(--ui-accent);
    background: var(--ui-ink);
    padding: 8px;
    color: var(--ui-accent);
    font: inherit;
    line-height: 1.6;
  }

  textarea {
    resize: none;
  }

  .website {
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .challenge {
    grid-area: challenge;
    align-self: start;
    min-height: 0;
  }

  input:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--ui-highlight);
    outline-offset: 1px;
  }

  .foot {
    grid-area: foot;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--field-gap);
  }

  .error {
    color: var(--ui-highlight);
  }

  button {
    border: 2px solid var(--ui-accent);
    background: var(--ui-ink);
    padding: 8px 20px;
    color: var(--ui-accent);
    font: inherit;
    letter-spacing: 1px;
    cursor: pointer;
  }

  button:disabled {
    color: var(--ui-accent-deep);
    border-color: var(--ui-accent-deep);
    cursor: default;
  }

  button:focus-visible {
    outline: 2px solid var(--ui-highlight);
    outline-offset: 1px;
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

    form {
      grid-template-rows: repeat(5, auto);
    }

    label {
      gap: 6px;
    }

    input,
    textarea {
      min-height: 44px;
      padding: 8px;
      font-size: 16px;
    }

    textarea {
      min-height: 96px;
    }

    button {
      min-height: 44px;
      padding: 8px 18px;
      font-size: 9px;
    }

    .foot button {
      width: 100%;
      background: var(--ui-accent);
      color: var(--ui-ink);
    }
  }
</style>
