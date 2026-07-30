<script lang="ts">
  import {
    HAND_DRAWN_FRAMES,
    framePerimeterCells,
    sliceTracks,
    type FrameArtId,
    type SliceSegment,
  } from "./frame";

  interface Props {
    art: FrameArtId;
    columns: SliceSegment[];
    rows: SliceSegment[];
  }

  let { art, columns, rows }: Props = $props();
  const drawn = $derived(HAND_DRAWN_FRAMES[art]);
  const cells = $derived(framePerimeterCells(drawn.band, columns, rows));
  const trackColumns = $derived(sliceTracks(columns));
  const trackRows = $derived(sliceTracks(rows));
</script>

<div
  class="frame-slices"
  style:grid-template-columns={trackColumns}
  style:grid-template-rows={trackRows}
  aria-hidden="true"
>
  {#each cells as cell}
    <svg
      style:grid-column={cell.column}
      style:grid-row={cell.row}
      viewBox={`${cell.sourceX} ${cell.sourceY} ${cell.width} ${cell.height}`}
      preserveAspectRatio="none"
    >
      <image href={drawn.src} width={drawn.source.w} height={drawn.source.h} />
    </svg>
  {/each}
</div>

<style>
  .frame-slices {
    position: absolute;
    inset: 0;
    display: grid;
    background: var(--surface-page);
    pointer-events: none;
  }

  .frame-slices svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    image-rendering: pixelated;
  }
</style>
