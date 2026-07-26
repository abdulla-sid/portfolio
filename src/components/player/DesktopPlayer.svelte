<script lang="ts">
  import type { PlayerController } from "./controller.svelte";
  import { formatTime } from "./time";
  import { marquee } from "./marquee";

  interface Props {
    player: PlayerController;
    refresh: number;
    segmentCount: number;
  }

  let { player, refresh, segmentCount }: Props = $props();
  const filledSegments = $derived(Math.round(player.progress * segmentCount));
</script>

<div class="player" class:is-playing={player.playing} aria-label="Music player">
  <div class="body">
    <div class="scr">
      {#key refresh}
        <div class="title">
          <span
            class="mq"
            use:marquee={{
              text: player.title,
              animation: "mq",
              scaleProperty: "--w-scale",
            }}
          ></span>
        </div>
        <div class="artist">
          <span
            class="mq"
            use:marquee={{
              text: player.artist,
              animation: "mq",
              scaleProperty: "--w-scale",
            }}
          ></span>
        </div>
      {/key}
      <div
        class="seg"
        data-no-drag
        role="progressbar"
        aria-label="Preview progress"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Math.round(player.progress * 100)}
      >
        {#each Array(segmentCount).keys() as i}
          <button
            type="button"
            aria-label="Seek to {Math.round((i / segmentCount) * 100)}%"
            class:f={i < filledSegments}
            onclick={() => player.seek(i / segmentCount)}
          ></button>
        {/each}
      </div>
      <div class="time">
        <span>{formatTime(player.currentTime)}</span><span
          >{player.duration ? formatTime(player.duration) : "0:30"}</span
        >
      </div>
    </div>

    <div class="wheel">
      <div class="ring"></div>
      <div class="ring2"></div>
      <button
        class="lab menu"
        onclick={() => (player.listOpen = !player.listOpen)}>MENU</button
      >
      <button
        class="lab left"
        aria-label="Previous track"
        onclick={() => player.step(-1)}
      >
        <span class="bar"></span><span class="tri flip"></span>
      </button>
      <button
        class="lab right"
        aria-label="Next track"
        onclick={() => player.step(1)}
      >
        <span class="tri"></span><span class="bar"></span>
      </button>
      <button
        class="hub"
        aria-label="Play or pause"
        onclick={player.togglePlay}
      >
        <span class="tri"></span><span class="pause"><i></i><i></i></span>
      </button>
    </div>
  </div>

  <ul class="list" hidden={!player.listOpen}>
    {#each player.tracks as track, i}
      <li>
        <button
          class="track"
          class:on={i === player.current}
          disabled={!track.preview}
          onclick={() => player.selectTrack(i)}
        >
          <span class="n">{String(i + 1).padStart(2, "0")}</span>
          {track.title ? `${track.title} — ${track.artist}` : "loading…"}
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .player {
    --u: calc(1px * var(--w-scale, 1));
    width: calc(236 * var(--u));
    font-size: 0;
  }

  .body {
    padding: calc(14 * var(--u));
    position: relative;
  }

  .scr {
    background: var(--player-screen);
    padding: calc(12 * var(--u)) calc(11 * var(--u));
    box-shadow: 0 0 0 calc(2 * var(--u)) var(--ui-accent-deep) inset;
  }

  .title,
  .artist {
    white-space: nowrap;
    overflow: hidden;
  }

  .title {
    color: var(--ui-highlight);
    font-size: calc(11 * var(--u));
    line-height: 1.5;
  }

  .artist {
    color: var(--text-muted);
    font-size: calc(8 * var(--u));
    margin-top: calc(8 * var(--u));
  }

  .mq {
    display: inline-flex;
    gap: calc(33 * var(--u));
  }

  @keyframes -global-mq {
    to {
      transform: translateX(calc(-1 * var(--mq-dist, 0px)));
    }
  }

  .seg {
    display: flex;
    gap: calc(2 * var(--u));
    margin-top: calc(12 * var(--u));
  }

  .seg button {
    width: calc(13 * var(--u));
    height: calc(9 * var(--u));
    padding: 0;
    border: 0;
    background: var(--player-meter);
    box-shadow: 0 0 0 calc(1 * var(--u)) var(--player-meter-edge) inset;
    cursor: pointer;
  }

  .seg button.f {
    background: var(--ui-accent);
    box-shadow: none;
  }

  .time {
    display: flex;
    justify-content: space-between;
    margin-top: calc(8 * var(--u));
    font-size: calc(7 * var(--u));
    color: var(--text-muted);
  }

  .wheel {
    position: relative;
    width: calc(168 * var(--u));
    height: calc(168 * var(--u));
    margin: calc(20 * var(--u)) auto calc(4 * var(--u));
  }

  .ring {
    position: absolute;
    inset: 0;
    background: var(--ui-accent-deep);
    clip-path: var(--circ);
  }

  .ring2 {
    position: absolute;
    inset: calc(7 * var(--u));
    background: var(--player-surface);
    clip-path: var(--circ);
  }

  .lab,
  .hub {
    position: absolute;
    border: 0;
    background: none;
    padding: 0;
    cursor: pointer;
    color: var(--ui-accent);
  }

  .menu {
    bottom: calc(13 * var(--u));
    left: 50%;
    transform: translateX(-50%);
    font-size: calc(8 * var(--u));
    font-family: inherit;
  }

  .left {
    left: calc(13 * var(--u));
    top: 50%;
    transform: translateY(-50%);
  }

  .right {
    right: calc(13 * var(--u));
    top: 50%;
    transform: translateY(-50%);
  }

  .left,
  .right {
    display: flex;
    align-items: center;
    gap: calc(2 * var(--u));
  }

  .hub {
    inset: calc(58 * var(--u));
    background: var(--ui-accent);
    clip-path: var(--circ);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .wheel .tri {
    width: calc(14 * var(--u));
    height: calc(14 * var(--u));
    background: var(--ui-accent);
    clip-path: var(--tri);
  }

  .wheel .tri.flip {
    transform: scaleX(-1);
  }

  .left .bar,
  .right .bar {
    width: calc(3 * var(--u));
    height: calc(14 * var(--u));
    background: var(--ui-accent);
  }

  .hub .tri {
    width: calc(22 * var(--u));
    height: calc(22 * var(--u));
    background: var(--ui-ink);
  }

  .hub .pause {
    display: none;
    gap: calc(5 * var(--u));
  }

  .hub .pause i {
    width: calc(5 * var(--u));
    height: calc(15 * var(--u));
    background: var(--ui-ink);
    display: block;
  }

  .is-playing .hub .tri {
    display: none;
  }

  .is-playing .hub .pause {
    display: flex;
  }

  .list {
    list-style: none;
    position: absolute;
    left: calc(14 * var(--u));
    right: calc(14 * var(--u));
    top: calc(40 * var(--u));
    background: var(--player-screen);
    box-shadow: 0 0 0 calc(2 * var(--u)) var(--ui-accent-deep) inset;
    padding: calc(6 * var(--u));
    z-index: 4;
  }

  .track {
    display: block;
    width: 100%;
    text-align: left;
    border: 0;
    background: var(--player-surface);
    color: var(--ui-accent);
    font-family: inherit;
    font-size: calc(7 * var(--u));
    line-height: 1.6;
    padding: calc(7 * var(--u)) calc(6 * var(--u));
    margin-bottom: calc(4 * var(--u));
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track:last-child {
    margin-bottom: 0;
  }

  .track .n {
    color: var(--text-muted);
  }

  .track.on {
    background: var(--ui-accent);
    color: var(--ui-ink);
  }

  .track.on .n {
    color: var(--ui-ink);
  }

  .track:disabled {
    opacity: 0.4;
    cursor: default;
  }

  @media (max-width: 900px) {
    .player {
      display: none;
    }
  }
</style>
