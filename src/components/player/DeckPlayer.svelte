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

  const VU_ROWS = 3;

  let rowsEl = $state<HTMLElement>();
  $effect(() => {
    if (!deck.listOpen) return;
    const row = rowsEl?.querySelector<HTMLElement>(".row.on");
    row?.scrollIntoView?.({ block: "nearest" });
  });

  let refresh = $state(0);
  const bumpRefresh = () => refresh++;
  document.fonts?.ready.then(bumpRefresh);

  function seekTo(event: MouseEvent) {
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    deck.seek((event.clientX - rect.left) / rect.width);
  }
</script>

<div
  class="deck"
  class:is-playing={deck.playing}
  class:is-buffering={deck.buffering}
  data-no-drag
  aria-label="Deck music player"
>
  <div class="screen">
    {#if deck.listOpen}
      <div class="listview">
        <div class="rows" bind:this={rowsEl} role="listbox" aria-label="Tracks">
          {#each deck.tracks as t, i}
            <button
              class="row"
              class:on={i === deck.current}
              role="option"
              aria-selected={i === deck.current}
              disabled={!t.preview}
              onclick={() => deck.selectTrack(i, true)}
            >
              <span class="n">{String(i + 1).padStart(2, "0")}</span>
              <span class="rt"
                >{t.title ? `${t.title} — ${t.artist}` : "loading…"}</span
              >
            </button>
          {/each}
        </div>
        <div class="scrollhint" aria-hidden="true">▲ ▼</div>
      </div>
    {:else}
      {#key refresh}
        <div class="txt">
          <div class="ttl">
            <span
              class="mq"
              use:marquee={{ text: deck.title, animation: "mq-deck" }}
            ></span>
          </div>
          <div class="art">
            <span
              class="mq"
              use:marquee={{ text: deck.artist, animation: "mq-deck" }}
            ></span>
          </div>
        </div>
      {/key}
      <div class="vu" aria-hidden="true">
        {#each Array(VU_ROWS).keys() as r}
          <div class="vrow">
            <span class="lvl" style="animation-delay: -{(r * 0.22).toFixed(2)}s"
            ></span>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div
    class="seekrow"
    role="progressbar"
    aria-label="Seek"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={Math.round(deck.progress * 100)}
  >
    <span class="time">{formatTime(deck.currentTime)}</span>

    <button
      type="button"
      class="seek"
      data-no-drag
      aria-label="Seek within track"
      onclick={seekTo}
    >
      <span class="needle" style="left: {deck.progress * 100}%"></span>
    </button>
    <span class="time"
      >{deck.duration ? formatTime(deck.duration) : "0:30"}</span
    >
  </div>

  <div class="bar">
    <button
      class="menu"
      class:act={deck.listOpen}
      data-no-drag
      onclick={() => (deck.listOpen = !deck.listOpen)}
    >
      MENU
    </button>
    <div class="transport">
      <button
        class="btn"
        data-no-drag
        aria-label="Previous track"
        onclick={() => deck.step(-1)}
      >
        <span class="g-prev"></span>
      </button>
      <button
        class="btn big"
        data-no-drag
        aria-label="Play or pause"
        onclick={deck.togglePlay}
      >
        <span class="g-play"></span>
        <span class="g-pause"><i></i><i></i></span>
      </button>
      <button
        class="btn"
        data-no-drag
        aria-label="Next track"
        onclick={() => deck.step(1)}
      >
        <span class="g-next"></span>
      </button>
    </div>
    <div class="count" aria-label="Track {deck.counter}">
      {String(deck.current + 1).padStart(2, "0")}<b
        >&nbsp;/&nbsp;{String(deck.tracks.length).padStart(2, "0")}</b
      >
    </div>
  </div>
</div>

<style>
  .deck {
    width: 100%;
    padding: var(--panel-gap, 22px);
    background: var(--player-surface);
    box-shadow:
      0 0 0 4px var(--ui-accent-deep) inset,
      0 0 0 8px var(--player-edge) inset;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .screen {
    background: var(--player-screen);
    box-shadow: 0 0 0 2px var(--ui-accent-deep) inset;
    padding: 12px 14px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 16px;
    min-height: 60px;
  }
  .screen::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      var(--player-scanline) 0 1px,
      transparent 1px 3px
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
    color: var(--ui-highlight);
    font-size: 12px;
    line-height: 1.6;
  }
  .art {
    color: var(--text-muted);
    font-size: 8px;
    margin-top: 9px;
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
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 120px;
    height: 36px;
  }
  .vrow {
    position: relative;
    height: 6px;
    background-image: repeating-linear-gradient(
      90deg,
      var(--player-meter) 0 9px,
      transparent 9px 12px
    );
  }
  .vrow .lvl {
    --lvl: var(--ui-accent);
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 45%;
    background-image: repeating-linear-gradient(
      90deg,
      var(--lvl) 0 9px,
      transparent 9px 12px
    );
  }
  .is-buffering .vrow .lvl {
    --lvl: var(--text-muted);
  }
  .is-playing:not(.is-buffering) .vrow .lvl {
    animation: vu 1.1s steps(6) infinite;
  }
  @keyframes vu {
    0% {
      width: 20%;
    }
    25% {
      width: 80%;
    }
    50% {
      width: 45%;
    }
    75% {
      width: 100%;
    }
    100% {
      width: 35%;
    }
  }

  .listview {
    position: absolute;
    inset: 0;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
  }
  .rows {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: none;
  }
  .rows::-webkit-scrollbar {
    display: none;
  }
  .row {
    display: flex;
    gap: 9px;
    width: 100%;
    text-align: left;
    border: 0;
    font-family: inherit;
    font-size: 8px;
    line-height: 1.6;
    color: var(--ui-accent);
    background: var(--player-surface);
    padding: 6px 8px;
    margin-bottom: 4px;
    cursor: pointer;
  }
  .row .rt {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .row .n {
    color: var(--text-muted);
  }
  .row.on {
    background: var(--ui-accent);
    color: var(--ui-ink);
  }
  .row.on .n {
    color: var(--ui-ink);
  }
  .row:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .scrollhint {
    position: absolute;
    right: 12px;
    top: 12px;
    color: var(--text-muted);
    font-size: 9px;
  }

  .seekrow {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .time {
    font-size: 8px;
    color: var(--text-muted);
    flex: 0 0 auto;
  }
  .seek {
    flex: 1;
    height: 16px;
    padding: 0;
    border: 0;
    background: var(--player-screen);
    box-shadow: 0 0 0 2px var(--ui-accent-deep) inset;
    position: relative;
    background-image: repeating-linear-gradient(
      90deg,
      var(--ui-accent-deep) 0 1px,
      transparent 1px 18px
    );
    cursor: pointer;
  }
  .needle {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 3px;
    margin-left: -1px;
    background: var(--ui-highlight);
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .menu {
    font-family: inherit;
    font-size: 9px;
    letter-spacing: 1px;
    color: var(--ui-accent);
    background: var(--player-channel);
    border: 0;
    padding: 12px 14px;
    box-shadow:
      0 0 0 2px var(--player-edge),
      0 0 0 3px var(--ui-accent-deep);
    cursor: pointer;
  }
  .menu.act {
    background: var(--ui-accent);
    color: var(--ui-ink);
    box-shadow:
      0 0 0 2px var(--player-edge),
      0 0 0 3px var(--ui-accent);
  }
  .transport {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .btn {
    width: 34px;
    height: 34px;
    border: 0;
    background: var(--player-channel);
    box-shadow:
      0 0 0 2px var(--player-edge),
      0 0 0 3px var(--ui-accent-deep);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .btn.big {
    width: 44px;
    height: 44px;
    background: var(--ui-accent);
    box-shadow:
      0 0 0 2px var(--player-edge),
      0 0 0 3px var(--ui-accent);
  }
  .g-prev,
  .g-next {
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    position: relative;
  }
  .g-next {
    border-left: 13px solid var(--ui-accent);
  }
  .g-prev {
    border-right: 13px solid var(--ui-accent);
  }
  .g-next::after {
    content: "";
    position: absolute;
    left: 2px;
    top: -8px;
    width: 3px;
    height: 16px;
    background: var(--ui-accent);
  }
  .g-prev::after {
    content: "";
    position: absolute;
    right: 2px;
    top: -8px;
    width: 3px;
    height: 16px;
    background: var(--ui-accent);
  }
  .g-play {
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-left: 16px solid var(--ui-ink);
    margin-left: 3px;
  }
  .g-pause {
    display: none;
    gap: 4px;
  }
  .g-pause i {
    display: block;
    width: 4px;
    height: 16px;
    background: var(--ui-ink);
  }
  .is-playing .g-play {
    display: none;
  }
  .is-playing .g-pause {
    display: flex;
  }
  .count {
    font-size: 9px;
    color: var(--ui-accent);
    letter-spacing: 1px;
    flex: 0 0 auto;
  }
  .count b {
    color: var(--text-muted);
    font-weight: normal;
  }
</style>
