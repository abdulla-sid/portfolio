<script lang="ts">
  import type { PlayerController } from "./controller.svelte";
  import { playerFromContext, requirePlayer } from "./context.svelte";
  import { formatTime } from "./time";
  import { marquee } from "./marquee";
  import { PRESET_LIMIT } from "./playlist";

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

  const presets = $derived(deck.tracks.slice(0, PRESET_LIMIT));

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
        {#each presets as track, index (index)}
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
    container: deck-chassis / inline-size;
    font-size: 8px;
    line-height: 1;
  }

  .caption {
    color: var(--ui-highlight);
    margin-bottom: 10px;
  }

  .chassis {
    --meter-unit: 16px;
    padding: 16px;
    box-shadow: inset 0 0 0 2px var(--ui-accent-deep);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .screen {
    position: relative;
    min-height: 60px;
    padding: 10px 14px;
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
    flex: 0 0 var(--vu-width, 156px);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .vrow {
    position: relative;
    height: 8px;
  }

  .ghost,
  .lvl {
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
      90deg,
      currentColor 0 calc(var(--meter-unit) - 4px),
      transparent calc(var(--meter-unit) - 4px) var(--meter-unit)
    );
  }

  .ghost {
    color: var(--player-meter-edge);
  }

  .lvl {
    color: var(--ui-accent);
    width: calc(var(--band-idle) * var(--meter-unit));
    animation: level var(--band-duration) steps(6, end) var(--band-delay)
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
      width: calc(2 * var(--meter-unit));
    }
    to {
      width: calc(8 * var(--meter-unit));
    }
  }

  .cap {
    position: absolute;
    top: 0;
    left: calc(var(--band-idle) * var(--meter-unit));
    width: 4px;
    height: 8px;
    background: var(--ui-highlight);
    animation: peak calc(var(--band-duration) * 3) steps(6, end)
      var(--band-delay) infinite alternate;
    animation-play-state: paused;
  }

  .is-playing:not(.is-buffering) .cap {
    animation-play-state: running;
  }

  @keyframes peak {
    from {
      left: calc(3 * var(--meter-unit));
    }
    to {
      left: calc(9 * var(--meter-unit));
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

  .seek::before {
    content: "";
    position: absolute;
    inset: -6px 0;
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
    flex-wrap: nowrap;
    align-items: center;
    column-gap: var(--bar-gap, 10px);
    margin-block: 8px 6px;
  }

  .transport {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--transport-gap, 8px);
  }

  .btn {
    width: var(--transport-size, 34px);
    height: var(--transport-size, 34px);
    border: 0;
    background: none;
    box-shadow: inset 0 0 0 2px var(--ui-accent-deep);
    display: grid;
    place-items: center;
    cursor: pointer;
  }

  .btn svg {
    width: 16px;
    height: 16px;
    fill: var(--ui-accent);
  }

  .btn.big {
    width: var(--transport-big-size, 44px);
    height: var(--transport-big-size, 44px);
    background: var(--ui-accent);
    box-shadow: none;
  }

  .btn.big svg {
    width: 24px;
    height: 24px;
    fill: var(--ui-ink);
  }

  .presets {
    --preset-size: 36px;
    --preset-gap: 6px;
    list-style: none;
    display: flex;
    flex-wrap: nowrap;
    justify-content: flex-end;
    gap: var(--preset-gap);
    margin-inline-start: auto;
  }

  @container deck-chassis (max-width: 416px) {
    .screen {
      gap: 16px;
    }

    .vu {
      --vu-width: 124px;
    }

    .presets {
      --preset-size: 28px;
      --preset-gap: 4px;
    }
  }

  @container deck-chassis (max-width: 358px) {
    .chassis {
      --meter-unit: 12px;
      --bar-gap: 8px;
      --transport-gap: 4px;
      --transport-size: 28px;
      --transport-big-size: 36px;
      padding: 12px;
      gap: 12px;
    }

    .screen {
      gap: 12px;
      padding: 8px 10px;
    }

    .vu {
      --vu-width: 100px;
    }

    .presets {
      --preset-size: 22px;
      --preset-gap: 2px;
    }
  }

  @container deck-chassis (max-width: 310px) {
    .chassis {
      --meter-unit: 10px;
      --bar-gap: 5px;
      --transport-gap: 2px;
      --transport-size: 24px;
      --transport-big-size: 28px;
      padding: 8px;
    }

    .screen {
      gap: 10px;
    }

    .vu {
      --vu-width: 88px;
    }

    .presets {
      --preset-size: 22px;
      --preset-gap: 2px;
    }
  }

  .preset {
    position: relative;
    width: var(--preset-size);
    height: var(--preset-size);
    border: 0;
    font-family: inherit;
    font-size: 8px;
    color: var(--ui-accent-deep);
    background: none;
    box-shadow: inset 0 0 0 2px var(--ui-accent-deep);
    cursor: pointer;
  }

  .preset::before {
    content: "";
    position: absolute;
    inset: -4px -2px;
  }

  @container deck-chassis (max-width: 358px) {
    .preset::before {
      inset: -4px -1px;
    }
  }

  .preset.on {
    color: var(--ui-ink);
    background: var(--ui-accent-deep);
  }

  .preset:disabled {
    opacity: 0.4;
    cursor: default;
  }

  @media (max-height: 740px) {
    .caption {
      display: none;
    }
  }
</style>
