<script lang="ts">
  import dais from "../assets/dave-dais.png";
  import daveFront from "../assets/dave-front.png";
  import daveSide from "../assets/dave-side.png";
  import { ANNOTATIONS, rerollPair } from "./daveAnnotations";

  const DAVE_W = 180;
  const DAVE_H = 240;

  const DAVE_FOOT_Y = 222;
  const DAVE_CENTER_X = 82;

  const DAIS_W = 220;
  const DAIS_H = 220;
  const DAIS_TOP_Y = 154;
  const DAIS_CENTER_X = 109.5;

  const FOOT_SINK = 12;

  const daisLeft = DAVE_CENTER_X - DAIS_CENTER_X;
  const daisTop = DAVE_FOOT_Y - DAIS_TOP_Y - FOOT_SINK;

  const daisCenterX = daisLeft + DAIS_W / 2;
  const daisCenterY = daisTop + DAIS_H / 2;

  const RING_CX = 109.5;
  const RING_CY = 178;
  const RING_RX = 81.5;
  const RING_RY = 15;
  const BEAM_RISE_H = 260;

  const EMITTER_PLANE_Y = RING_CY + RING_RY;

  const beamLeft = daisLeft + RING_CX - RING_RX;
  const beamW = 2 * RING_RX;
  const beamTop = daisTop + DAIS_TOP_Y - BEAM_RISE_H;
  const beamBottom = daisTop + RING_CY + RING_RY;
  const beamHeight = beamBottom - beamTop;

  interface Pose {
    src: string;
    topY: number;
    footY: number;
    footCenterX: number;
    tilt: number;
    nudgeX?: number;
  }

  const POSES = {
    side: { src: daveSide, topY: 19, footY: 222, footCenterX: 71.5, tilt: -3 },
    front: {
      src: daveFront,
      topY: 17,
      footY: 219,
      footCenterX: 89,
      tilt: 0,
      nudgeX: 3,
    },
  } satisfies Record<string, Pose>;

  type PoseId = keyof typeof POSES;

  const ANCHOR = POSES.side;
  const ANCHOR_NUDGE_X = 3;
  const ANCHOR_LIFT_Y = -18;

  function tiltedFoot(pose: Pose) {
    const theta = (pose.tilt * Math.PI) / 180;
    const dx = pose.footCenterX - DAVE_W / 2;
    const dy = pose.footY - DAVE_H / 2;
    return {
      x: DAVE_W / 2 + dx * Math.cos(theta) - dy * Math.sin(theta),
      y: DAVE_H / 2 + dx * Math.sin(theta) + dy * Math.cos(theta),
    };
  }

  const anchorFoot = tiltedFoot(ANCHOR);
  const footing = {
    x: anchorFoot.x + ANCHOR_NUDGE_X,
    y: anchorFoot.y + ANCHOR_LIFT_Y,
  };

  function poseOffset(pose: Pose) {
    const foot = tiltedFoot(pose);
    return {
      x: Math.round(footing.x - foot.x) + (pose.nudgeX ?? 0),
      y: Math.round(footing.y - foot.y),
    };
  }

  const unit = (n: number) => `calc(${n} * var(--dave-scale))`;

  const poseTransform = (pose: Pose) => {
    const { x, y } = poseOffset(pose);
    return `translate(${unit(x)}, ${unit(y)}) rotate(${pose.tilt}deg)`;
  };

  const figureTop = Math.min(
    ...Object.values(POSES).map((pose) => pose.topY + poseOffset(pose).y),
  );

  const SCAN_LEAD_IN = 18;
  const scanFrom = figureTop - RING_RY - SCAN_LEAD_IN;
  const scanTo = daisTop + RING_CY;
  const scanSpan = scanTo - scanFrom;

  const scanFade = SCAN_LEAD_IN / scanSpan;

  const ringCx = daisLeft + RING_CX;

  const REVEAL_LEAD = 0.32;

  const frontOffset = poseOffset(POSES.front);

  const callouts = ANNOTATIONS.map((annotation) => {
    const x = annotation.anchorX + frontOffset.x;
    const y = annotation.anchorY + frontOffset.y;
    const midY = annotation.boxY + frontOffset.y;
    const drop = annotation.boxY - annotation.anchorY;
    const cornerX = x - Math.abs(drop);
    const reachedAt = (y - scanFrom) / scanSpan;
    const from = Math.max(0.03, reachedAt - REVEAL_LEAD);

    return {
      ...annotation,
      x,
      y,
      midY,
      boxRight: unit(DAVE_W - annotation.boxEdge),
      diagonalLength: Math.SQRT2 * Math.abs(drop),
      diagonalAngle: drop > 0 ? 135 : -135,
      runWidth: cornerX - annotation.boxEdge,
      from,
      span: Math.max(0.001, reachedAt - from),
    };
  });

  let pick = $state(0);

  let root: HTMLDivElement;
  let touched = $state(false);
  let tapped = $state(false);
  let tapStart: { x: number; y: number } | null = null;

  function handlePointerEnter(event: PointerEvent) {
    if (event.pointerType === "touch" || tapped) return;
    pick = rerollPair(pick);
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.pointerType !== "touch") {
      tapStart = null;
      return;
    }

    touched = true;
    tapStart = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: PointerEvent) {
    if (!tapStart) return;

    const distance = Math.hypot(
      event.clientX - tapStart.x,
      event.clientY - tapStart.y,
    );
    tapStart = null;

    if (distance > 10) return;

    tapped = !tapped;
    if (tapped) pick = rerollPair(pick);
  }

  function handleDocumentPointerDown(event: PointerEvent) {
    if (
      tapped &&
      event.pointerType === "touch" &&
      !root.contains(event.target as Node)
    ) {
      tapped = false;
    }
  }
</script>

<svelte:document onpointerdown={handleDocumentPointerDown} />

{#snippet figure(id: PoseId)}
  {@const current = POSES[id]}
  <div
    class="figure"
    style:width={unit(DAVE_W)}
    style:height={unit(DAVE_H)}
    style:transform={poseTransform(current)}
  >
    <img class="figure-art" src={current.src} alt="" />
    <div
      class="figure-light"
      style:--figure-mask={`url("${current.src}")`}
    ></div>
  </div>
{/snippet}

<div
  bind:this={root}
  class="dave-widget"
  class:tapped
  class:touched
  aria-hidden="true"
  onpointerenter={handlePointerEnter}
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  style:width={unit(DAVE_W)}
  style:height={unit(DAVE_H)}
  style:--dais-cx={daisCenterX}
  style:--dais-cy={daisCenterY}
  style:--scan-from={scanFrom}
  style:--scan-to={scanTo}
  style:--ring-cx={unit(ringCx)}
  style:--ring-rx={unit(RING_RX)}
  style:--ring-ry={unit(RING_RY)}
  style:--scan-fade={scanFade.toFixed(4)}
>
  <img
    class="dais dais-rear"
    src={dais}
    alt=""
    style:left={unit(daisLeft)}
    style:top={unit(daisTop)}
    style:width={unit(DAIS_W)}
    style:height={unit(DAIS_H)}
  />
  <div
    class="beam"
    style:left={unit(beamLeft)}
    style:top={unit(beamTop)}
    style:width={unit(beamW)}
    style:height={unit(beamHeight)}
    style:--beam-foot={unit(RING_RY)}
  >
    <div class="beam-outer"></div>
    <div class="beam-core"></div>
  </div>
  <div class="scan-plane scan-far"><div class="scan-ring"></div></div>
  <div class="layer pose-side">
    <div class="clip below-plane">
      <div class="clip outside-disc">
        {@render figure("side")}
      </div>
    </div>
  </div>
  <div class="layer pose-front">
    <div class="clip above-plane">
      {@render figure("front")}
    </div>
    <div class="clip inside-disc">
      <div class="clip below-plane">
        {@render figure("front")}
      </div>
    </div>
  </div>
  <div class="scan-plane scan-near"><div class="scan-ring"></div></div>
  <img
    class="dais dais-front"
    src={dais}
    alt=""
    style:left={unit(daisLeft)}
    style:top={unit(daisTop)}
    style:width={unit(DAIS_W)}
    style:height={unit(DAIS_H)}
    style:--dais-front-inset={unit(EMITTER_PLANE_Y)}
  />
  <div class="annotations">
    {#each callouts as callout (callout.id)}
      <div
        class="callout"
        style:--ann-from={callout.from.toFixed(4)}
        style:--ann-span={callout.span.toFixed(4)}
      >
        <div
          class="ann-box"
          style:top={unit(callout.midY)}
          style:right={callout.boxRight}
        >
          {#each callout.lines[pick] as line}
            <span>{line}</span>
          {/each}
        </div>
        <div
          class="ann-run"
          style:left={unit(callout.boxEdge)}
          style:top={unit(callout.midY)}
          style:width={unit(callout.runWidth)}
        ></div>
        <div
          class="ann-diagonal"
          style:left={unit(callout.x)}
          style:top={unit(callout.y)}
          style:width={unit(callout.diagonalLength)}
          style:--ann-angle="{callout.diagonalAngle}deg"
        ></div>
        <div
          class="ann-anchor"
          style:left={unit(callout.x)}
          style:top={unit(callout.y)}
        ></div>
      </div>
    {/each}
  </div>
</div>

<style>
  @property --scan-progress {
    syntax: "<number>";
    inherits: true;
    initial-value: 0;
  }

  @property --scan-edge {
    syntax: "<length>";
    inherits: true;
    initial-value: 0px;
  }

  .dave-widget {
    --dave-scale: 2px;
    --ann-box-width: 176px;
    --ann-hairline: calc(1 * var(--dave-scale));
    --ann-cap-height: calc(6 * var(--dave-scale));
    --scan-duration: 620ms;
    --scan-progress: 0;
    --scan-edge: calc(var(--scan-from) * var(--dave-scale));
    position: absolute;
    right: var(--page-margin);
    top: 50%;
    transform: translateY(-50%);
    transition:
      --scan-progress var(--scan-duration) linear,
      --scan-edge var(--scan-duration) linear;
  }

  .dave-widget.tapped {
    --scan-duration: 800ms;
    --scan-progress: 1;
    --scan-edge: calc(var(--scan-to) * var(--dave-scale));
  }

  @media (hover: hover) and (pointer: fine) {
    .dave-widget:not(.touched):hover {
      --scan-duration: 800ms;
      --scan-progress: 1;
      --scan-edge: calc(var(--scan-to) * var(--dave-scale));
    }
  }

  .dave-widget img {
    position: absolute;
    image-rendering: pixelated;
  }

  .dais-rear {
    z-index: 0;
  }

  .dais-front {
    z-index: 6;
    clip-path: inset(var(--dais-front-inset) 0 0);
  }

  .layer {
    position: absolute;
    inset: 0;
  }

  .dave-widget {
    --scan-plane-stop: max(0px, var(--scan-edge));
    --scan-above-plane: linear-gradient(
      to bottom,
      var(--mask-opaque) var(--scan-plane-stop),
      transparent var(--scan-plane-stop)
    );
    --scan-disc: radial-gradient(
      var(--ring-rx) var(--ring-ry) at var(--ring-cx) var(--scan-edge),
      var(--mask-opaque) 99%,
      transparent 100%
    );
    --scan-below-plane: linear-gradient(
      to bottom,
      transparent var(--scan-plane-stop),
      var(--mask-opaque) var(--scan-plane-stop)
    );
    --scan-outside-disc: radial-gradient(
      var(--ring-rx) var(--ring-ry) at var(--ring-cx) var(--scan-edge),
      transparent 99%,
      var(--mask-opaque) 100%
    );
  }

  .pose-side {
    z-index: 3;
  }

  .pose-front {
    z-index: 4;
  }

  .clip {
    position: absolute;
    inset: 0;
    mask-repeat: no-repeat;
  }

  .above-plane {
    mask-image: var(--scan-above-plane);
  }

  .below-plane {
    mask-image: var(--scan-below-plane);
  }

  .inside-disc {
    mask-image: var(--scan-disc);
  }

  .outside-disc {
    mask-image: var(--scan-outside-disc);
  }

  .figure {
    position: absolute;
    left: 0;
    top: 0;
  }

  .figure-art {
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }

  .figure-light {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      var(--dave-figure-light-strong) 0%,
      var(--dave-figure-light-medium) 42%,
      var(--dave-figure-light-subtle) 72%,
      transparent 100%
    );
    mask-image: var(--figure-mask);
    mask-repeat: no-repeat;
    mask-size: 100% 100%;
  }

  .scan-plane {
    --ring-bloom: calc(9 * var(--dave-scale));
    position: absolute;
    top: 0;
    left: calc(var(--ring-cx) - var(--ring-rx) - var(--ring-bloom));
    width: calc(2 * (var(--ring-rx) + var(--ring-bloom)));
    height: calc(2 * (var(--ring-ry) + var(--ring-bloom)));
    transform: translateY(
      calc(var(--scan-edge) - var(--ring-ry) - var(--ring-bloom))
    );
    opacity: min(
      1,
      calc(var(--scan-progress) / var(--scan-fade)),
      calc((1 - var(--scan-progress)) / var(--scan-fade))
    );
  }

  .scan-far {
    z-index: 2;
    clip-path: inset(0 0 50% 0);
  }

  .scan-near {
    z-index: 5;
    clip-path: inset(50% 0 0 0);
  }

  .scan-ring {
    position: absolute;
    inset: var(--ring-bloom);
    border: calc(2 * var(--dave-scale)) solid var(--ring-stroke);
    border-radius: 50%;
    background: var(--dave-scan-fill);
    box-shadow: 0 0 var(--ring-bloom) var(--dave-scan-bloom);
  }

  .scan-near .scan-ring {
    --ring-stroke: var(--dave-scan-near);
  }

  .scan-far .scan-ring {
    --ring-stroke: var(--dave-scan-far);
  }

  .beam {
    position: absolute;
    z-index: 1;
    transition: filter 220ms ease-out;
  }

  .dave-widget.tapped .beam {
    filter: brightness(1.35);
  }

  @media (hover: hover) and (pointer: fine) {
    .dave-widget:not(.touched):hover .beam {
      filter: brightness(1.35);
    }
  }

  .beam-outer,
  .beam-core {
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 100%;
    height: 100%;
    transform: translateX(-50%);
    border-bottom-left-radius: 50% var(--beam-foot);
    border-bottom-right-radius: 50% var(--beam-foot);
  }

  .beam-outer {
    background: radial-gradient(
      ellipse at center,
      var(--dave-beam-strong) 0%,
      var(--dave-beam-medium) 55%,
      var(--dave-beam-faint) 100%
    );
    border-left: 2px solid var(--dave-beam-edge);
    border-right: 2px solid var(--dave-beam-edge);
    border-bottom: 2px solid var(--dave-beam-edge);
    mask-image: linear-gradient(
      to top,
      var(--mask-opaque) 0%,
      var(--mask-opaque) 65%,
      transparent 100%
    );
  }

  .beam-core {
    background: linear-gradient(
      to right,
      transparent 0%,
      var(--dave-beam-core) 34%,
      var(--dave-beam-core) 66%,
      transparent 100%
    );
    mask-image: linear-gradient(
      to top,
      var(--mask-opaque) 0%,
      var(--mask-opaque) 50%,
      transparent 90%
    );
  }

  .annotations {
    position: absolute;
    inset: 0;
    z-index: 7;
    display: none;
    pointer-events: none;
  }

  .callout {
    --ann-t: (var(--scan-progress) - var(--ann-from)) / var(--ann-span);
    position: absolute;
    inset: 0;
  }

  .ann-box {
    position: absolute;
    display: flex;
    flex-direction: column;
    width: var(--ann-box-width);
    padding: calc(var(--ann-cap-height) + 8px) 11px 11px;
    border: var(--ann-hairline) solid var(--border-primary);
    background:
      repeating-linear-gradient(
        to bottom,
        var(--dave-callout-scanline) 0 var(--dave-scale),
        transparent var(--dave-scale) calc(2 * var(--dave-scale))
      ),
      var(--dave-callout-fill);
    color: var(--text-primary);
    font-size: 9px;
    line-height: 2;
    letter-spacing: 0.5px;
    transform: translateY(-50%);
    opacity: clamp(0, calc((var(--ann-t) - 0.78) / 0.22), 1);
  }

  .ann-box::before {
    --tick-pitch: calc(3 * var(--dave-scale));
    --tick-size: calc(11 * var(--dave-scale)) calc(3 * var(--dave-scale));
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: var(--ann-cap-height);
    background:
      repeating-linear-gradient(
          to right,
          var(--ui-ink) 0 var(--ann-hairline),
          transparent var(--ann-hairline) var(--tick-pitch)
        )
        calc(100% - var(--tick-pitch)) center / var(--tick-size) no-repeat,
      var(--ui-accent);
  }

  .ann-anchor {
    position: absolute;
    width: calc(3 * var(--dave-scale));
    height: calc(3 * var(--dave-scale));
    background: var(--ui-accent);
    transform: translate(-50%, -50%);
    opacity: clamp(0, calc(var(--ann-t) / 0.06), 1);
  }

  .ann-box span {
    display: block;
  }

  .ann-diagonal,
  .ann-run {
    position: absolute;
    height: var(--ann-hairline);
    margin-top: calc(var(--ann-hairline) / -2);
    background: var(--ui-accent);
  }

  .ann-diagonal {
    background: linear-gradient(to right, transparent, var(--ui-accent));
    transform-origin: left center;
    transform: rotate(var(--ann-angle))
      scaleX(clamp(0, calc(var(--ann-t) / 0.5), 1));
  }

  .ann-run {
    transform-origin: right center;
    transform: scaleX(clamp(0, calc((var(--ann-t) - 0.5) / 0.3), 1));
  }

  @media (min-width: 1360px) {
    .annotations {
      display: block;
    }
  }

  @media (max-width: 900px) {
    .dave-widget {
      --dave-scale: 1.8px;
      right: auto;
      left: 50%;
      top: 50%;
      transform: translate(
        calc(-1 * var(--dais-cx) * var(--dave-scale)),
        calc(-1 * var(--dais-cy) * var(--dave-scale) + 140px)
      );
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dave-widget,
    .dave-widget.tapped,
    .dave-widget:hover {
      --scan-duration: 1ms;
    }
  }
</style>
