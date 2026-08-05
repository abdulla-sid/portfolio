<script lang="ts">
  import {
    HAND_DRAWN_FRAMES,
    frameCellBackground,
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
  style:--slice-image={`url("${drawn.src}")`}
  aria-hidden="true"
>
  {#each cells as cell}
    {@const background = frameCellBackground(cell, drawn.source)}
    <div
      class="slice"
      style:grid-column={cell.column}
      style:grid-row={cell.row}
      style:background-size={background.size}
      style:background-position={background.position}
    ></div>
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

  .slice {
    min-width: 0;
    min-height: 0;
    background-image: var(--slice-image);
    background-repeat: no-repeat;
    image-rendering: pixelated;
  }
</style>
