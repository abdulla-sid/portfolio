<script lang="ts">
  import { tick } from "svelte";
  import { EXPERIENCES } from "./experiences";

  const mapModule = import("./ExperienceMap.svelte");
  const lastIndex = EXPERIENCES.length - 1;

  let activeIndex = $state(0);
  let newerPaddle = $state<HTMLButtonElement>();
  let olderPaddle = $state<HTMLButtonElement>();

  const activeExperience = $derived(EXPERIENCES[activeIndex]);
  const selectedId = $derived(activeExperience.id);
  const focus = $derived({
    ...activeExperience.location,
    city: activeExperience.city,
  });
  const canGoNewer = $derived(activeIndex > 0);
  const canGoOlder = $derived(activeIndex < lastIndex);

  function goTo(index: number) {
    activeIndex = Math.max(0, Math.min(index, lastIndex));
  }

  async function onPagerKeydown(event: KeyboardEvent) {
    const step =
      event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    if (step === 0) return;

    event.preventDefault();
    goTo(activeIndex + step);

    await tick();
    const [pressed, opposite] =
      step < 0 ? [newerPaddle, olderPaddle] : [olderPaddle, newerPaddle];
    if (pressed?.disabled) opposite?.focus();
  }
</script>

<div class="split">
  <button
    bind:this={newerPaddle}
    class="paddle prev"
    type="button"
    aria-label="Previous experience"
    data-no-drag
    disabled={!canGoNewer}
    onclick={() => goTo(activeIndex - 1)}
    onkeydown={onPagerKeydown}
  >
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M10 3 5 8l5 5"></path>
    </svg>
  </button>

  <section class="page" aria-label="Experience details">
    <div class="heading">
      <h2>{activeExperience.title}</h2>
      <p class="org">{activeExperience.org}</p>
      <p class="dates">{activeExperience.dates}</p>
    </div>

    <div class="narrative">
      {#each activeExperience.narrative as paragraph}
        <p>{paragraph}</p>
      {/each}
    </div>
  </section>

  <p class="announcement" aria-live="polite">
    {activeExperience.title}, {activeExperience.org}, {activeExperience.dates}
  </p>

  <div class="map-slot">
    {#await mapModule then { default: ExperienceMap }}
      <ExperienceMap {focus} {selectedId} />
    {/await}
  </div>

  <button
    bind:this={olderPaddle}
    class="paddle next"
    type="button"
    aria-label="Next experience"
    data-no-drag
    disabled={!canGoOlder}
    onclick={() => goTo(activeIndex + 1)}
    onkeydown={onPagerKeydown}
  >
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 3l5 5-5 5"></path>
    </svg>
  </button>

  <ol class="rail" aria-hidden="true">
    {#each EXPERIENCES as experience, index (experience.id)}
      <li class="node" class:active={index === activeIndex}></li>
    {/each}
  </ol>
</div>

<style>
  .split {
    --gutter: calc(10px * var(--hd-scale, 2));
    --paddle-width: 24px;
    --paddle-height: 116px;
    --edge-trim-left: var(--content-trim-left, 0px);
    --edge-trim-right: var(--content-trim-right, 0px);
    --map-share: 0.62;
    --map-scale: 0.9;
    display: grid;
    grid-template-areas:
      "prev text map  next"
      "rail rail rail rail";
    grid-template-columns:
      calc(var(--paddle-width) + var(--edge-trim-left))
      minmax(0, 1fr)
      calc(
        (
            var(--map-share) *
              (100% - var(--edge-trim-left) - var(--edge-trim-right)) - 2 *
              var(--paddle-width) - 3 * var(--gutter)
          ) *
          var(--map-scale)
      )
      calc(var(--paddle-width) + var(--edge-trim-right));
    grid-template-rows: minmax(0, 1fr) auto;
    gap: var(--gutter);
    height: 100%;
    min-height: 0;
  }

  .paddle {
    display: grid;
    width: var(--paddle-width);
    height: var(--paddle-height);
    padding: 0;
    align-self: center;
    place-items: center;
    border: 2px solid var(--border-primary);
    border-radius: 0;
    background: var(--ui-ink);
    color: var(--ui-accent);
    cursor: pointer;
  }

  .prev {
    grid-area: prev;
    justify-self: start;
  }

  .next {
    grid-area: next;
    justify-self: end;
  }

  .paddle:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .paddle:focus-visible {
    outline: 2px solid var(--ui-highlight);
    outline-offset: 2px;
  }

  .paddle svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: square;
    stroke-linejoin: miter;
    shape-rendering: crispEdges;
  }

  .page {
    display: flex;
    grid-area: text;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    color: var(--text-primary);
  }

  .heading {
    flex: none;
  }

  h2 {
    color: var(--ui-highlight);
    font: inherit;
    font-size: 13px;
    line-height: 1.6;
  }

  .org {
    margin-top: 6px;
    color: var(--ui-accent);
    font-size: 10px;
    line-height: 1.6;
  }

  .dates {
    margin-top: 6px;
    font-size: 9px;
    line-height: 1.6;
    opacity: 0.72;
  }

  .narrative {
    flex: 1;
    min-height: 0;
    margin-top: 18px;
    padding-right: 8px;
    overflow-y: auto;
    font-size: 9px;
    line-height: 1.8;
    scrollbar-color: var(--ui-accent) transparent;
    scrollbar-width: thin;
  }

  .narrative p + p {
    margin-top: 12px;
  }

  .narrative::-webkit-scrollbar {
    width: 5px;
  }

  .narrative::-webkit-scrollbar-track {
    background: transparent;
  }

  .narrative::-webkit-scrollbar-thumb {
    background: var(--ui-accent);
  }

  .map-slot {
    grid-area: map;
    align-self: center;
    aspect-ratio: 1;
    margin-top: var(--gutter);
    min-width: 0;
    min-height: 0;
  }

  .rail {
    position: relative;
    display: flex;
    grid-area: rail;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    margin: 0 var(--paddle-width) 6px;
    list-style: none;
  }

  .rail::before {
    content: "";
    position: absolute;
    top: 50%;
    right: 14px;
    left: 14px;
    height: 3px;
    background: var(--ui-accent-deep);
    transform: translateY(-50%);
  }

  .node {
    position: relative;
    width: 20px;
    height: 20px;
    border: 2px solid var(--ui-accent-deep);
    background: var(--surface-page);
  }

  .node.active {
    border-color: var(--ui-accent);
    background: var(--ui-accent);
  }

  .announcement {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 1100px) {
    .split {
      --gutter: 12px;
      grid-template-areas:
        "prev text next"
        "prev map  next"
        "rail rail rail";
      grid-template-columns:
        var(--paddle-width)
        minmax(0, 1fr)
        var(--paddle-width);
      grid-template-rows: minmax(160px, 3fr) minmax(140px, 2fr) auto;
    }

    .map-slot {
      align-self: stretch;
      aspect-ratio: auto;
      margin-top: 0;
    }

    .rail {
      margin: 0 0 6px;
    }
  }

  @media (max-width: 900px) {
    h2 {
      font-size: 12px;
    }

    .org {
      font-size: 9px;
    }

    .dates {
      font-size: 8px;
    }

    .narrative {
      margin-top: 12px;
      font-size: 7px;
      line-height: 1.75;
    }

    .narrative p + p {
      margin-top: 10px;
    }

    .node {
      width: 12px;
      height: 12px;
    }

    .rail::before {
      right: 8px;
      left: 8px;
      height: 2px;
    }
  }

  @media (max-width: 1100px) and (max-height: 740px) {
    .split {
      --gutter: 10px;
      --paddle-height: 80px;
      grid-template-rows: minmax(100px, 3fr) minmax(90px, 2fr) auto;
    }
  }
</style>
