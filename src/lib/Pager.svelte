<script lang="ts">
  import { tick } from "svelte";
  import type { Snippet } from "svelte";

  interface Props {
    count: number;
    index: number;
    itemLabel: string;
    announcement: string;
    children: Snippet;
  }

  let {
    count,
    index = $bindable(0),
    itemLabel,
    announcement,
    children,
  }: Props = $props();

  let prevPaddle = $state<HTMLButtonElement>();
  let nextPaddle = $state<HTMLButtonElement>();

  const lastIndex = $derived(count - 1);
  const canGoPrev = $derived(index > 0);
  const canGoNext = $derived(index < lastIndex);

  function goTo(target: number) {
    index = Math.max(0, Math.min(target, lastIndex));
  }

  async function onKeydown(event: KeyboardEvent) {
    const step =
      event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    if (step === 0) return;

    event.preventDefault();
    goTo(index + step);

    await tick();
    const [pressed, opposite] =
      step < 0 ? [prevPaddle, nextPaddle] : [nextPaddle, prevPaddle];
    if (pressed?.disabled) opposite?.focus();
  }
</script>

<button
  bind:this={prevPaddle}
  class="paddle prev"
  type="button"
  aria-label="Previous {itemLabel}"
  data-no-drag
  disabled={!canGoPrev}
  onclick={() => goTo(index - 1)}
  onkeydown={onKeydown}
>
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M10 3 5 8l5 5"></path>
  </svg>
</button>

{@render children()}

<p class="announcement" aria-live="polite">{announcement}</p>

<button
  bind:this={nextPaddle}
  class="paddle next"
  type="button"
  aria-label="Next {itemLabel}"
  data-no-drag
  disabled={!canGoNext}
  onclick={() => goTo(index + 1)}
  onkeydown={onKeydown}
>
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M6 3l5 5-5 5"></path>
  </svg>
</button>

<ol class="rail" aria-hidden="true">
  {#each Array(count).keys() as node (node)}
    <li class="node" class:active={node === index}></li>
  {/each}
</ol>

<style>
  .paddle {
    position: relative;
    display: grid;
    width: var(--paddle-width, 18px);
    height: var(--paddle-height, 116px);
    padding: 0;
    align-self: center;
    place-items: center;
    border: 2px solid var(--border-primary);
    border-radius: 0;
    background: var(--ui-ink);
    color: var(--ui-accent);
    cursor: pointer;
  }

  .paddle::before {
    content: "";
    position: absolute;
    inset: 0;
  }

  .prev::before {
    right: -6px;
  }

  .next::before {
    left: -6px;
  }

  .prev,
  .next {
    grid-row: 1 / -2;
    grid-column: 1 / -1;
    align-self: center;
  }

  .prev {
    justify-self: start;
    margin-left: calc(-1 * var(--paddle-strip, 22px));
  }

  .next {
    justify-self: end;
    margin-right: calc(-1 * var(--paddle-strip, 22px));
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
    width: 12px;
    height: 12px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: square;
    stroke-linejoin: miter;
    shape-rendering: crispEdges;
  }

  .rail {
    position: relative;
    display: flex;
    grid-area: rail;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    margin: 0 var(--rail-inset, 0px) 6px;
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

  @media (max-width: 900px) {
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
</style>
