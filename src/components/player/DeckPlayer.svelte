<script lang="ts">
  import type { PlayerController } from "./controller.svelte";
  import { playerFromContext, requirePlayer } from "./context.svelte";
  import { formatTime } from "./time";
  import { marquee } from "./marquee";

  interface Props {
    controller?: PlayerController;
  }

  let { controller }: Props = $props();
  const contextualPlayer = playerFromContext();
  const deck = $derived(requirePlayer(controller ?? contextualPlayer));

  const BANDS = [
    { duration: "1.07s", delay: "-0.41s", idle: 3 },
    { duration: "1.39s", delay: "-1.13s", idle: 5 },
    { duration: "1.73s", delay: "-2.07s", idle: 2 },
  ];

  const SEEK_STEP = 0.05;
  const SEEK_PAGE = 0.2;

  let refresh = $state(0);
  document.fonts?.ready.then(() => refresh++);

  function seekToPointer(event: MouseEvent) {
    if (event.detail === 0) return;
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    deck.seek((event.clientX - rect.left) / rect.width);
  }

  const SEEK_KEYS: Record<string, number> = {
    ArrowLeft: -SEEK_STEP,
    ArrowRight: SEEK_STEP,
    ArrowDown: -SEEK_STEP,
    ArrowUp: SEEK_STEP,
    PageDown: -SEEK_PAGE,
    PageUp: SEEK_PAGE,
  };

  function seekByKey(event: KeyboardEvent) {
    const target =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? 1
          : event.key in SEEK_KEYS
            ? deck.progress + SEEK_KEYS[event.key]
            : null;

    if (target === null) return;
    event.preventDefault();
    deck.seek(Math.min(1, Math.max(0, target)));
  }
</script>

<section
  class="deck player"
  class:is-playing={deck.playing}
  class:is-buffering={deck.buffering}
  data-no-drag
  aria-label="Music player"
>
  <p class="caption">what i'm listening to right now</p>

  <div class="chassis">
    <div class="screen">
      {#key refresh}
        <div class="txt">
          <p class="ttl">
            <span
              class="mq"
              use:marquee={{ text: deck.title, animation: "mq-deck" }}
            ></span>
          </p>
          <p class="art">
            <span
              class="mq"
              use:marquee={{ text: deck.artist, animation: "mq-deck" }}
            ></span>
          </p>
        </div>
      {/key}

      <div class="vu" aria-hidden="true">
        {#each BANDS as band (band.duration)}
          <div class="vrow">
            <span class="ghost"></span>
            <span
              class="lvl"
              style:--band-duration={band.duration}
              style:--band-delay={band.delay}
              style:--band-idle={band.idle}
            ></span>
            <span
              class="cap"
              style:--band-duration={band.duration}
              style:--band-delay={band.delay}
              style:--band-idle={band.idle}
            ></span>
          </div>
        {/each}
      </div>
    </div>

    <div class="seekrow">
      <span class="time">{formatTime(deck.currentTime)}</span>
      <button
        class="seek"
        data-no-drag
        role="slider"
        aria-label="Seek within track"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Math.round(deck.progress * 100)}
        aria-valuetext="{formatTime(deck.currentTime)} elapsed"
        onclick={seekToPointer}
        onkeydown={seekByKey}
      >
        <span class="trough"></span>
        <span class="fill" style:width="{deck.progress * 100}%"></span>
        <span class="ticks" aria-hidden="true"></span>
        <span class="needle" style:left="{deck.progress * 100}%"></span>
      </button>
    </div>

    <div class="bar">
      <div class="transport">
        <button
          class="btn"
          data-no-drag
          aria-label="Previous track"
          onclick={() => deck.step(-1)}
        >
          <svg
            viewBox="0 0 8 8"
            shape-rendering="crispEdges"
            aria-hidden="true"
          >
            <path d="M0 0H2V8H0Z M8 0V8H7V7H6V6H5V5H4V3H5V2H6V1H7V0Z" />
          </svg>
        </button>
        <button
          class="btn big"
          data-no-drag
          aria-label={deck.playing ? "Pause" : "Play"}
          onclick={deck.togglePlay}
        >
          {#if deck.playing}
            <svg
              viewBox="0 0 8 8"
              shape-rendering="crispEdges"
              aria-hidden="true"
            >
              <path d="M1 0H3V8H1Z M5 0H7V8H5Z" />
            </svg>
          {:else}
            <svg
              viewBox="0 0 8 8"
              shape-rendering="crispEdges"
              aria-hidden="true"
            >
              <path d="M1 0H3V1H4V2H5V3H6V5H5V6H4V7H3V8H1Z" />
            </svg>
          {/if}
        </button>
        <button
          class="btn"
          data-no-drag
          aria-label="Next track"
          onclick={() => deck.step(1)}
        >
          <svg
            viewBox="0 0 8 8"
            shape-rendering="crispEdges"
            aria-hidden="true"
          >
            <path d="M0 0V8H1V7H2V6H3V5H4V3H3V2H2V1H1V0Z M6 0H8V8H6Z" />
          </svg>
        </button>
      </div>

      <ul class="presets" aria-label="Tracks">
        {#each deck.tracks as track, index (index)}
          <li>
            <button
              class="preset"
              class:on={index === deck.current}
              data-no-drag
              aria-current={index === deck.current ? "true" : undefined}
              aria-label="Track {index + 1}"
              disabled={!track.preview}
              onclick={() => deck.selectTrack(index, true)}
            >
              {index + 1}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</section>

<style>
  .deck {
    font-size: 8px;
    line-height: 1;
  }

  .caption {
    color: var(--ui-highlight);
    margin-bottom: 10px;
  }

  .chassis {
    padding: 16px;
    box-shadow: inset 0 0 0 2px var(--ui-accent-deep);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .screen {
    position: relative;
    min-height: 68px;
    padding: 14px 16px;
    background: var(--ui-ink);
    display: flex;
    align-items: center;
    gap: 24px;
    overflow: hidden;
  }

  .screen::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      var(--player-scanline) 0 2px,
      transparent 2px 4px
    );
  }

  .txt {
    flex: 1;
    min-width: 0;
  }

  .ttl,
  .art {
    white-space: nowrap;
    overflow: hidden;
  }

  .ttl {
    font-size: 16px;
    color: var(--ui-accent);
  }

  .art {
    color: var(--ui-accent-deep);
    letter-spacing: 2px;
    margin-top: 14px;
  }

  .mq {
    display: inline-flex;
    gap: 33px;
  }

  @keyframes -global-mq-deck {
    to {
      transform: translateX(calc(-1 * var(--mq-dist, 0px)));
    }
  }

  .vu {
    flex: 0 0 232px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .vrow {
    position: relative;
    height: 10px;
  }

  .ghost,
  .lvl {
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
      90deg,
      currentColor 0 12px,
      transparent 12px 16px
    );
  }

  .ghost {
    color: var(--player-meter-edge);
  }

  .lvl {
    color: var(--ui-accent);
    width: calc(var(--band-idle) * 16px);
    animation: level var(--band-duration) steps(7, end) var(--band-delay)
      infinite alternate;
    animation-play-state: paused;
  }

  .is-buffering .lvl {
    color: var(--text-muted);
  }

  .is-playing:not(.is-buffering) .lvl {
    animation-play-state: running;
  }

  @keyframes level {
    from {
      width: 32px;
    }
    to {
      width: 176px;
    }
  }

  .cap {
    position: absolute;
    top: 0;
    left: calc(var(--band-idle) * 16px);
    width: 4px;
    height: 10px;
    background: var(--ui-highlight);
    animation: peak calc(var(--band-duration) * 3) steps(9, end)
      var(--band-delay) infinite alternate;
    animation-play-state: paused;
  }

  .is-playing:not(.is-buffering) .cap {
    animation-play-state: running;
  }

  @keyframes peak {
    from {
      left: 48px;
    }
    to {
      left: 192px;
    }
  }

  .seekrow {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .time {
    flex: 0 0 auto;
    color: var(--ui-accent-deep);
    letter-spacing: 2px;
  }

  .seek {
    position: relative;
    flex: 1;
    height: 14px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }

  .trough,
  .fill {
    position: absolute;
    top: 6px;
    height: 2px;
  }

  .trough {
    left: 0;
    right: 0;
    background: var(--player-meter-edge);
  }

  .fill {
    left: 0;
    background: var(--ui-accent-deep);
  }

  .ticks {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 2px;
    height: 2px;
    background-image: repeating-linear-gradient(
      90deg,
      var(--player-meter-edge) 0 2px,
      transparent 2px calc(100% / 6)
    );
  }

  .needle {
    position: absolute;
    top: 2px;
    width: 2px;
    height: 10px;
    background: var(--ui-accent);
  }

  .bar {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .transport {
    display: flex;
    gap: 8px;
  }

  .btn {
    width: 40px;
    height: 40px;
    padding: 9px;
    border: 0;
    background: none;
    box-shadow: inset 0 0 0 2px var(--ui-accent-deep);
    display: grid;
    place-items: center;
    cursor: pointer;
  }

  .btn svg {
    width: 100%;
    height: 100%;
    fill: var(--ui-accent);
  }

  .btn.big {
    background: var(--ui-accent);
    box-shadow: none;
  }

  .btn.big svg {
    fill: var(--ui-ink);
  }

  .presets {
    margin-left: auto;
    list-style: none;
    display: flex;
    gap: 6px;
  }

  .preset {
    width: 36px;
    height: 36px;
    border: 0;
    font-family: inherit;
    font-size: 8px;
    color: var(--ui-accent-deep);
    background: none;
    box-shadow: inset 0 0 0 2px var(--ui-accent-deep);
    cursor: pointer;
  }

  .preset.on {
    color: var(--ui-ink);
    background: var(--ui-accent-deep);
  }

  .preset:disabled {
    opacity: 0.4;
    cursor: default;
  }

  @media (max-height: 750px) {
    .caption {
      display: none;
    }
  }
</style>
