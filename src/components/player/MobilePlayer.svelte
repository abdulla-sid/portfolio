<script lang="ts">
  import type { PlayerController } from "./controller.svelte";
  import { formatTime } from "./time";

  interface Props {
    player: PlayerController;
    segmentCount: number;
  }

  let { player, segmentCount }: Props = $props();
  const filledSegments = $derived(Math.round(player.progress * segmentCount));
</script>

<div
  class="mobile-dock"
  class:is-playing={player.playing}
  aria-label="Music player"
>
  <button
    class="mobile-play"
    aria-label="Play or pause"
    onclick={player.togglePlay}
    disabled={!player.ready}
  >
    <span class="mobile-play-icon">PLAY</span>
    <span class="mobile-pause-icon">PAUSE</span>
  </button>

  <div class="mobile-screen">
    <div class="mobile-title">{player.title}</div>
    <div class="mobile-artist">{player.artist}</div>
    <div
      class="mobile-seg"
      style:grid-template-columns={`repeat(${segmentCount}, 1fr)`}
      role="progressbar"
      aria-label="Preview progress"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={Math.round(player.progress * 100)}
    >
      {#each Array(segmentCount).keys() as i}
        <span class:filled={i < filledSegments}></span>
      {/each}
    </div>
    <div class="mobile-time">
      <span>{formatTime(player.currentTime)}</span><span
        >{player.duration ? formatTime(player.duration) : "0:30"}</span
      >
    </div>
  </div>

  <button
    class="mobile-menu"
    aria-label="Toggle playlist"
    aria-expanded={player.listOpen}
    onclick={() => (player.listOpen = !player.listOpen)}>MENU</button
  >

  <ul class="mobile-list" hidden={!player.listOpen}>
    {#each player.tracks as track, i}
      <li>
        <button
          class:active={i === player.current}
          disabled={!track.preview}
          onclick={() => player.selectTrack(i, true)}
        >
          <span>{String(i + 1).padStart(2, "0")}</span>
          {track.title ? `${track.title} — ${track.artist}` : "loading…"}
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .mobile-dock {
    display: none;
  }

  @media (max-width: 900px) {
    .mobile-dock {
      display: grid;
      grid-template-columns: 48px minmax(0, 1fr) 44px;
      gap: 10px;
      align-items: center;
      position: relative;
      height: 100px;
      padding: 12px;
      background: var(--player-screen);
      color: var(--ui-accent);
    }

    .mobile-play,
    .mobile-menu {
      min-width: 44px;
      min-height: 44px;
      border: 2px solid var(--ui-accent-deep);
      background: var(--player-control);
      color: var(--ui-accent);
      font: inherit;
      font-size: 7px;
      cursor: pointer;
    }

    .mobile-play {
      width: 48px;
      height: 48px;
      border-color: var(--ui-accent);
      background: var(--ui-accent);
      color: var(--ui-ink);
    }

    .mobile-play:disabled {
      opacity: 0.55;
      cursor: wait;
    }

    .mobile-pause-icon {
      display: none;
    }

    .is-playing .mobile-play-icon {
      display: none;
    }

    .is-playing .mobile-pause-icon {
      display: inline;
    }

    .mobile-screen {
      min-width: 0;
    }

    .mobile-title,
    .mobile-artist {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .mobile-title {
      color: var(--ui-highlight);
      font-size: 9px;
      line-height: 1.4;
    }

    .mobile-artist {
      margin-top: 5px;
      color: var(--text-muted);
      font-size: 7px;
    }

    .mobile-seg {
      display: grid;
      gap: 2px;
      margin-top: 7px;
    }

    .mobile-seg span {
      min-width: 0;
      height: 6px;
      border: 1px solid var(--player-meter-edge);
      background: var(--player-meter);
    }

    .mobile-seg span.filled {
      border-color: var(--ui-accent);
      background: var(--ui-accent);
    }

    .mobile-time {
      display: flex;
      justify-content: space-between;
      margin-top: 3px;
      color: var(--text-muted);
      font-size: 6px;
    }

    .mobile-menu {
      width: 44px;
      height: 44px;
    }

    .mobile-list {
      position: absolute;
      right: 0;
      bottom: 100%;
      left: 0;
      z-index: 5;
      max-height: 220px;
      margin: 0;
      padding: 8px;
      overflow: auto;
      list-style: none;
      border: 2px solid var(--ui-accent-deep);
      background: var(--player-screen);
    }

    .mobile-list button {
      width: 100%;
      min-height: 44px;
      margin-bottom: 4px;
      padding: 8px;
      overflow: hidden;
      border: 0;
      background: var(--player-surface);
      color: var(--ui-accent);
      font: inherit;
      font-size: 7px;
      text-align: left;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .mobile-list button.active {
      background: var(--ui-accent);
      color: var(--ui-ink);
    }

    .mobile-list button:disabled {
      opacity: 0.45;
    }

    .mobile-list button span {
      margin-right: 8px;
      color: var(--text-muted);
    }
  }
</style>
