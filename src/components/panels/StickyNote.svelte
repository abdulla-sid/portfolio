<script lang="ts">
  import { steppedCorner } from "../../lib/widget/notch";

  const PAPER = steppedCorner(120, 90, 15);
  const PAPER_SCALE = 2;

  const LINES = [
    { label: "BUILDING", value: "this site" },
    { label: "READING", value: "the pragmatic programmer" },
    { label: "COFFEE", value: "03 today" },
  ];
</script>

<aside
  class="note"
  style:--note-width="{PAPER.width * PAPER_SCALE}px"
  style:--note-height="{PAPER.height * PAPER_SCALE}px"
>
  <svg class="paper" viewBox={PAPER.viewBox} aria-hidden="true">
    <path d={PAPER.path}></path>
  </svg>
  <span class="tape" aria-hidden="true"></span>
  <p class="heading">NOTE TO SELF</p>
  <dl>
    {#each LINES as line (line.label)}
      <dt>{line.label}</dt>
      <dd>{line.value}</dd>
    {/each}
  </dl>
</aside>

<style>
  .note {
    position: relative;
    flex: 0 0 auto;
    width: var(--note-width);
    height: var(--note-height);
    margin-left: -20px;
    padding: 24px 20px 20px;
    color: var(--note-ink);
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
    left: calc(50% - 28px);
    width: 56px;
    height: 20px;
    background: var(--note-tape);
  }

  .heading,
  dl {
    position: relative;
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

  @media (max-width: 1440px), (max-height: 850px) {
    .note {
      display: none;
    }
  }
</style>
