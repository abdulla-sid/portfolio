<script lang="ts">
  import { untrack } from "svelte";
  import type { Snippet } from "svelte";
  import { draggable } from "./actions/draggable";
  import { resizable as resizableAction } from "./actions/resizable";
  import { windows } from "./windows.svelte";
  import HandDrawnFrame from "./widget/HandDrawnFrame.svelte";
  import {
    HAND_DRAWN_FRAMES,
    cssSize,
    type FrameArtId,
    type SliceSegment,
  } from "./widget/frame";

  interface Props {
    id: string;
    frame: "hand-drawn" | "double";
    art?: FrameArtId;
    x?: number;
    y?: number;
    anchor?: string;
    scale?: number;
    width?: number | string;
    height?: number | string;
    sliceX?: SliceSegment[];
    sliceY?: SliceSegment[];
    collapseY?: number;
    whiten?: number;
    resizable?: boolean;
    mobileHidden?: boolean;
    desktopHidden?: boolean;
    onResized?: () => void;
    children: Snippet;
  }

  let {
    id,
    frame,
    art = "small",
    x,
    y,
    anchor = "",
    scale = 2,
    width = frame === "hand-drawn"
      ? HAND_DRAWN_FRAMES[art].band.w * scale
      : undefined,
    height = frame === "hand-drawn"
      ? HAND_DRAWN_FRAMES[art].band.h * scale
      : undefined,
    sliceX,
    sliceY,
    collapseY = 1,
    whiten = 0,
    resizable = false,
    mobileHidden = false,
    desktopHidden = false,
    onResized,
    children,
  }: Props = $props();

  const drawn = $derived(HAND_DRAWN_FRAMES[art]);

  const frameFilter = $derived(
    whiten > 0
      ? `saturate(${1 - whiten}) brightness(${1 + whiten * 1.8})`
      : "none",
  );
  let el = $state<HTMLElement>()!;
  const canResize = $derived(resizable && frame === "double");
  const hasSlices = $derived(
    frame === "hand-drawn" && sliceX !== undefined && sliceY !== undefined,
  );
  $effect(() => {
    const node = el;
    untrack(() => windows.register(id));
    const raise = () => windows.bringToFront(id);
    node.addEventListener("pointerdown", raise, { capture: true });
    const resized = () => onResized?.();
    node.addEventListener("widgetresized", resized);
    return () => {
      node.removeEventListener("pointerdown", raise, { capture: true });
      node.removeEventListener("widgetresized", resized);
      windows.unregister(id);
    };
  });

  const sizeStyle = $derived(
    [
      x !== undefined ? `left: ${x}px` : "",
      y !== undefined ? `top: ${y}px` : "",
      width !== undefined ? `width: ${cssSize(width)}` : "",
      height !== undefined ? `height: ${cssSize(height)}` : "",
    ]
      .filter(Boolean)
      .join("; "),
  );
</script>

<div
  bind:this={el}
  data-widget-id={id}
  class="widget {frame === 'hand-drawn' ? 'hand-drawn' : 'double'}"
  class:sliced={hasSlices}
  class:mobile-hidden={mobileHidden}
  class:desktop-hidden={desktopHidden}
  style="{anchor}; {sizeStyle}"
  style:--hd-scale-base={scale}
  style:--collapse-y={collapseY}
  style:--hd-band-x={drawn.band.x}
  style:--hd-band-y={drawn.band.y}
  style:--hd-src-w={drawn.source.w}
  style:--hd-src-h={drawn.source.h}
  style:--hd-frame-image={`url("${drawn.src}")`}
  style:filter={frameFilter}
  style:z-index={windows.zIndexOf(id)}
  use:draggable
>
  {#if hasSlices}
    <HandDrawnFrame {art} columns={sliceX ?? []} rows={sliceY ?? []} />
  {/if}
  {#if frame === "double"}
    <div class="tbar">
      {#if canResize && el}
        <button
          class="grip"
          aria-label="Resize"
          use:resizableAction={{ widget: el }}><i></i><i></i><i></i></button
        >
      {/if}
    </div>
  {/if}
  {@render children()}
</div>

<style>
  .widget {
    --hd-scale: var(--hd-scale-base, 1);
    position: absolute;
    image-rendering: pixelated;
    cursor: grab;
    touch-action: none;
    scale: 1 var(--collapse-y, 1);
    transform-origin: center;
  }

  .hand-drawn {
    background-image: var(--hd-frame-image);
    background-position: calc(var(--hd-band-x) * -1px * var(--hd-scale))
      calc(var(--hd-band-y) * -1px * var(--hd-scale));
    background-size: calc(var(--hd-src-w) * 1px * var(--hd-scale))
      calc(var(--hd-src-h) * 1px * var(--hd-scale));
    background-repeat: no-repeat;
  }

  .hand-drawn.sliced {
    background-image: none;
  }

  .double {
    --w-scale: 1;
    --u: calc(1px * var(--w-scale));
    background: var(--surface-page);
    box-shadow:
      0 0 0 calc(2 * var(--u)) var(--ui-accent),
      0 0 0 calc(4 * var(--u)) var(--surface-page),
      0 0 0 calc(6 * var(--u)) var(--ui-accent-deep);
  }

  .tbar {
    background: var(--ui-accent);
    height: calc(26 * var(--u));
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 calc(7 * var(--u));
  }

  .grip {
    border: 0;
    background: none;
    padding: 0;
    cursor: nesw-resize;
    display: flex;
    flex-direction: column;
    gap: calc(3 * var(--u));
    touch-action: none;
  }
  .grip i {
    width: calc(17 * var(--u));
    height: calc(3 * var(--u));
    background: var(--ui-ink);
    display: block;
  }

  @media (min-width: 901px) {
    .widget[data-widget-id="menu-window"] {
      --menu-window-scale: 0.95;
      --menu-window-top-min: 125px;
      --panel-body: 12px;
      --panel-label: 9px;
      --panel-gap: 22px;
      --panel-leading: 2;
      --deck-inner-gap: 16px;
      --menu-window-reserve: calc(
        var(--page-margin) + var(--menu-item-width) + var(--menu-item-clearance)
      );
      --menu-window-max-width: calc(1302px * var(--menu-window-scale));
      --menu-window-width: var(--menu-window-max-width);
      --menu-window-max-height: 900px;
      --menu-window-band: calc(
        100vh - var(--menu-window-top-min) - var(--page-margin) -
          var(--desktop-footer-band)
      );
      --menu-window-height: clamp(
        380px,
        var(--menu-window-band),
        var(--menu-window-max-height)
      );
      --menu-window-top: calc(
        var(--menu-window-top-min) +
          max(0px, (var(--menu-window-band) - var(--menu-window-height)) / 2)
      );
    }
  }

  @media (min-width: 901px) and (max-width: 1865px) {
    .widget[data-widget-id="menu-window"] {
      --menu-window-width: clamp(
        460px,
        calc(100vw - var(--menu-window-reserve) - var(--page-margin)),
        var(--menu-window-max-width)
      );
    }
  }

  @media (min-width: 901px) and (max-width: 1200px) {
    .widget[data-widget-id="menu-window"] {
      --menu-window-edge: min(var(--page-margin), 40px);
      --menu-window-right: var(--menu-window-edge);
      --menu-window-left: max(var(--menu-window-reserve), 26vw);
      --menu-window-width: calc(
        100vw - var(--menu-window-left) - var(--menu-window-edge)
      );
    }
  }

  @media (min-width: 2000px) {
    .widget[data-widget-id="menu-window"] {
      --menu-window-width: min(
        65vw,
        calc(100vw - var(--menu-window-reserve) - var(--page-margin))
      );
    }
  }

  @media (min-width: 901px) and (max-height: 850px) {
    .widget[data-widget-id="menu-window"] {
      --menu-window-top-min: var(--page-margin);
      --menu-window-reserve: var(--menu-title-clearance);
    }
  }

  @media (min-width: 901px) and (max-width: 1200px) and (max-height: 850px) {
    .widget[data-widget-id="menu-window"] {
      --menu-window-left: var(--menu-window-reserve);
    }
  }

  @media (min-width: 901px) and (max-height: 850px),
    (min-width: 901px) and (max-width: 1200px) {
    .widget[data-widget-id="menu-window"] {
      --panel-body: 10px;
      --panel-label: 8px;
      --panel-gap: 16px;
      --panel-leading: 1.7;
      --deck-inner-gap: 10px;
    }
  }

  @media (min-width: 901px) {
    .widget.desktop-hidden {
      display: none;
    }
  }

  @media (min-width: 800px) and (max-width: 900px) and (min-height: 1100px) {
    .widget[data-widget-id="player"] {
      display: none;
    }
  }

  @media (max-width: 900px) {
    .widget.mobile-hidden {
      display: none;
    }

    .widget[data-widget-id="menu-window"] {
      --hd-scale: 1;
      top: var(--mobile-panel-top) !important;
      right: var(--mobile-panel-inline) !important;
      bottom: var(--mobile-panel-bottom) !important;
      left: var(--mobile-panel-inline) !important;
      width: auto !important;
      height: auto !important;
      min-height: 0;
      margin: 0 !important;
      transform: none !important;
      background-color: var(--surface-page);
      border: 0;
      box-shadow: none;
    }

    .widget[data-widget-id="menu-window"].sliced {
      background-image: none;
    }

    .widget[data-widget-id="rotation"] {
      top: 20px !important;
      right: 82px !important;
      left: auto !important;
      width: 24px !important;
      height: 34px !important;
      z-index: 1000 !important;
      background-image: none !important;
      scale: 1;
      transform: none !important;
      transform-origin: top right;
      pointer-events: none;
    }

    .widget[data-widget-id="player"] {
      top: auto !important;
      right: calc(
        var(--mobile-panel-inline) + var(--mobile-panel-corner-size)
      ) !important;
      bottom: calc(
        var(--mobile-panel-bottom) + var(--mobile-panel-corner-size) +
          var(--mobile-panel-content-gap)
      ) !important;
      left: calc(
        var(--mobile-panel-inline) + var(--mobile-panel-corner-size)
      ) !important;
      width: auto !important;
      height: var(--mobile-player-height);
      transform: none !important;
      border-top: 2px solid var(--ui-accent-deep);
      box-shadow: none;
      z-index: 1001 !important;
    }

    .widget[data-widget-id="player"] .tbar {
      display: none;
    }
  }
</style>
