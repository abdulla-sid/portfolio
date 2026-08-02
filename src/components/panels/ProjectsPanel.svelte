<script lang="ts">
  import { tick } from "svelte";
  import { PROJECTS } from "./projects";

  const lastIndex = PROJECTS.length - 1;

  let activeIndex = $state(0);
  let prevPaddle = $state<HTMLButtonElement>();
  let nextPaddle = $state<HTMLButtonElement>();

  const activeProject = $derived(PROJECTS[activeIndex]);
  const canGoPrev = $derived(activeIndex > 0);
  const canGoNext = $derived(activeIndex < lastIndex);

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
      step < 0 ? [prevPaddle, nextPaddle] : [nextPaddle, prevPaddle];
    if (pressed?.disabled) opposite?.focus();
  }
</script>

<div class="split">
  <button
    bind:this={prevPaddle}
    class="paddle prev"
    type="button"
    aria-label="Previous project"
    data-no-drag
    disabled={!canGoPrev}
    onclick={() => goTo(activeIndex - 1)}
    onkeydown={onPagerKeydown}
  >
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M10 3 5 8l5 5"></path>
    </svg>
  </button>

  <section class="page" aria-label="Project details">
    <div class="heading">
      <h2>{activeProject.title}</h2>
      <p class="context">{activeProject.context}</p>
      <p class="dates">{activeProject.dates}</p>
    </div>

    <p class="impact">{activeProject.impact}</p>

    <div class="narrative">
      {#each activeProject.narrative as paragraph}
        <p>{paragraph}</p>
      {/each}
    </div>

    <ul class="stack">
      {#each activeProject.stack as item}
        <li>{item}</li>
      {/each}
    </ul>
  </section>

  <p class="announcement" aria-live="polite">
    {activeProject.title}, {activeProject.context}, {activeProject.dates}
  </p>

  <button
    bind:this={nextPaddle}
    class="paddle next"
    type="button"
    aria-label="Next project"
    data-no-drag
    disabled={!canGoNext}
    onclick={() => goTo(activeIndex + 1)}
    onkeydown={onPagerKeydown}
  >
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 3l5 5-5 5"></path>
    </svg>
  </button>

  <ol class="rail" aria-hidden="true">
    {#each PROJECTS as project, index (project.id)}
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
    display: grid;
    grid-template-areas:
      "prev text next"
      "rail rail rail";
    grid-template-columns:
      calc(var(--paddle-width) + var(--edge-trim-left))
      minmax(0, 1fr)
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

  .context {
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

  .impact {
    flex: none;
    margin-top: 14px;
    color: var(--ui-highlight);
    font-size: 9px;
    line-height: 1.8;
  }

  .narrative {
    flex: 1;
    min-height: 0;
    margin-top: 14px;
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

  .stack {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 14px;
    padding-right: 8px;
    list-style: none;
  }

  .stack li {
    padding: 4px 7px;
    border: 2px solid var(--ui-accent-deep);
    font-size: 7px;
    line-height: 1.4;
    letter-spacing: 1px;
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
    }
  }

  @media (max-width: 900px) {
    h2 {
      font-size: 12px;
    }

    .context {
      font-size: 9px;
    }

    .dates {
      font-size: 8px;
    }

    .impact,
    .narrative {
      margin-top: 12px;
      font-size: 7px;
      line-height: 1.75;
    }

    .narrative p + p {
      margin-top: 10px;
    }

    .stack {
      margin-top: 12px;
    }

    .stack li {
      font-size: 6px;
    }
  }

  @media (max-width: 1100px) and (max-height: 740px) {
    .split {
      --gutter: 10px;
      --paddle-height: 80px;
    }
  }
</style>
