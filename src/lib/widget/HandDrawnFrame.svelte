<script lang="ts">
  import {
    HAND_DRAWN_FRAMES,
    createHorizontalSlices,
    createMobileFrameSlices,
    createSliceColumns,
    type FrameArtId,
    type HorizontalSliceSegment,
  } from "./frame";

  interface Props {
    art: FrameArtId;
    segments: HorizontalSliceSegment[];
  }

  let { art, segments }: Props = $props();
  const drawn = $derived(HAND_DRAWN_FRAMES[art]);
  const horizontalSlices = $derived(
    createHorizontalSlices(drawn.band.x, segments),
  );
  const sliceColumns = $derived(createSliceColumns(horizontalSlices));
  const mobileSlices = $derived(createMobileFrameSlices(drawn.band));
</script>

<div
  class="frame-slices"
  style:grid-template-columns={sliceColumns}
  aria-hidden="true"
>
  {#each horizontalSlices as segment}
    <svg
      viewBox={`${segment.sourceX} ${drawn.band.y} ${segment.width} ${drawn.band.h}`}
      preserveAspectRatio="none"
    >
      <image href={drawn.src} width={drawn.source.w} height={drawn.source.h} />
    </svg>
  {/each}
</div>

<div class="mobile-frame" aria-hidden="true">
  {#each mobileSlices as segment}
    <svg
      viewBox={`${segment.sourceX} ${segment.sourceY} ${segment.width} ${segment.height}`}
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
    pointer-events: none;
  }

  .frame-slices svg,
  .mobile-frame svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    image-rendering: pixelated;
  }

  .mobile-frame {
    display: none;
  }

  @media (max-width: 900px) {
    :global(.widget[data-widget-id="menu-window"]) .frame-slices {
      display: none;
    }

    :global(.widget[data-widget-id="menu-window"]) .mobile-frame {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns:
        var(--mobile-panel-corner-size) minmax(0, 1fr)
        var(--mobile-panel-corner-size);
      grid-template-rows:
        var(--mobile-panel-corner-size) minmax(0, 1fr)
        var(--mobile-panel-corner-size);
      pointer-events: none;
    }
  }
</style>
