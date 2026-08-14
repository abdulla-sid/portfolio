<script lang="ts">
  import { steppedCorner } from "../../lib/widget/notch";

  const PAPER_WIDTH = 120;
  const PAPER_MIN_HEIGHT = 90;
  const PAPER_CORNER = 15;
  const PAPER_SCALE = 2;

  const LINES = [
    { label: "READING", value: "the hitchhiker's guide to the galaxy" },
    { label: "COFFEE", value: "03 today" },
    { label: "PAINTING", value: "badly" },
  ];

  let contentHeight = $state(0);

  const paperHeight = $derived(
    Math.max(PAPER_MIN_HEIGHT, Math.ceil(contentHeight / PAPER_SCALE)),
  );
  const paper = $derived(steppedCorner(PAPER_WIDTH, paperHeight, PAPER_CORNER));
</script>

<aside
  class="note"
  style:--note-width="{paper.width * PAPER_SCALE}px"
  style:--note-height="{paper.height * PAPER_SCALE}px"
>
  <svg class="paper" viewBox={paper.viewBox} aria-hidden="true">
    <path d={paper.path}></path>
  </svg>
  <span class="tape" aria-hidden="true"></span>
  <div class="content" bind:clientHeight={contentHeight}>
    <p class="heading">NOTE TO SELF</p>
    <dl>
      {#each LINES as line (line.label)}
        <dt>{line.label}</dt>
        <dd>{line.value}</dd>
      {/each}
    </dl>
  </div>
</aside>

<style>
  .note {
    position: relative;
    flex: 0 0 auto;
    width: var(--note-width);
    height: var(--note-height);
    color: var(--note-ink);
  }

  .content {
    position: relative;
    padding: 24px 20px 20px;
  }

  .paper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    shape-rendering: crispEdges;
    fill: var(--note-paper);
  }

  .tape {
    position: absolute;
    top: -10px;
    left: calc(50% - 14px);
    width: 28px;
    height: 20px;
    background: var(--note-tape);
  }

  .heading {
    font-size: 8px;
    color: var(--note-label);
    margin-bottom: 15px;
  }

  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px 10px;
  }

  dt {
    font-size: 8px;
    color: var(--note-label);
  }

  dd {
    font-size: 10px;
    line-height: 1.5;
  }
</style>
