<script lang="ts">
  import { onDestroy, tick } from "svelte";
  import Widget from "../lib/Widget.svelte";
  import { prefersReducedMotion } from "../lib/motion";
  import { createWindowMachine, type WindowState } from "./menu/windowMachine";
  import ExperiencePanel from "./map/ExperiencePanel.svelte";
  import AboutPanel from "./panels/AboutPanel.svelte";
  import ContactPanel from "./panels/ContactPanel.svelte";
  import ProjectsPanel from "./panels/ProjectsPanel.svelte";
  import { menuLabel, type MenuId } from "../app/menu";
  import { notchedTab } from "../lib/widget/notch";

  interface Props {
    id: MenuId;

    onOpened?: () => void;

    onClosing?: () => void;

    onClosed: () => void;
  }

  let { id, onOpened, onClosing, onClosed }: Props = $props();

  const FRAME = {
    f1: { collapseY: 0.65, whiten: 0.25 },
    f2: { collapseY: 0.3, whiten: 0.75 },
    line: { collapseY: 0.011, whiten: 1 },
  } as const;

  const CLOSE_TAB = notchedTab(15, 54);
  const CLOSE_TAB_SCALE = 1.8;
  const CLOSE_TAB_MOBILE = notchedTab(24, 94);

  const reduceMotion = prefersReducedMotion();
  let win = $state<WindowState>({ phase: "closed", frame: null });
  let dialogEl = $state<HTMLDivElement>();
  const machine = createWindowMachine(
    (s) => {
      win = s;
      if (s.phase === "open") {
        onOpened?.();
        void tick().then(() => {
          if (win.phase === "open") dialogEl?.focus();
        });
      }
      if (s.phase === "closing" && s.frame === "f1") onClosing?.();
    },
    reduceMotion ? 0 : undefined,
  );

  let hasOpened = false;

  const initialId = () => id;
  let displayedId = $state(initialId());
  let pendingId = $state<MenuId | null>(null);
  const displayedLabel = $derived(menuLabel(displayedId));

  const isOpen = $derived(
    win.phase === "open" || (win.phase === "closing" && win.frame !== "line"),
  );
  const showLineBar = $derived(win.frame === "line");
  const view = $derived(
    win.frame ? FRAME[win.frame] : { collapseY: 1, whiten: 0 },
  );

  $effect(() => {
    machine.open();
  });

  $effect(() => {
    if (id !== displayedId) pendingId = id;
  });

  $effect(() => {
    if (
      win.phase === "open" &&
      pendingId !== null &&
      pendingId !== displayedId
    ) {
      machine.close();
    } else if (win.phase === "closed" && pendingId !== null) {
      displayedId = pendingId;
      pendingId = null;
      machine.open();
    }
  });

  $effect(() => {
    if (win.phase === "opening" || win.phase === "open") hasOpened = true;
    if (hasOpened && win.phase === "closed" && pendingId === null) {
      document
        .querySelector<HTMLButtonElement>('.menu-item[aria-pressed="true"]')
        ?.focus();
      onClosed();
    }
  });

  function requestClose() {
    if (win.phase === "open") machine.close();
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") requestClose();
  }

  onDestroy(() => machine.dispose());
</script>

<svelte:window onkeydown={onKeydown} />

<Widget
  id="menu-window"
  frame="hand-drawn"
  art="xl"
  scale={2}
  width="var(--menu-window-width, 1302px)"
  height="var(--menu-window-height, 726px)"
  sliceX={[
    { width: 65 },
    { width: 128, flexible: true },
    { width: 50 },
    { width: 166, flexible: true },
    { width: 48 },
    { width: 127, flexible: true },
    { width: 67 },
  ]}
  sliceY={[
    { width: 26 },
    { width: 43, flexible: true },
    { width: 9 },
    { width: 38, flexible: true },
    { width: 17 },
    { width: 16, flexible: true },
    { width: 11 },
    { width: 67, flexible: true },
    { width: 20 },
    { width: 90, flexible: true },
    { width: 26 },
  ]}
  collapseY={view.collapseY}
  whiten={view.whiten}
  anchor="top: var(--menu-window-top, 125px); right: var(--page-margin)"
>
  {#if isOpen}
    <div
      class="dialog"
      role="dialog"
      aria-label="{displayedLabel} window"
      tabindex="-1"
      bind:this={dialogEl}
    >
      <button
        class="close"
        type="button"
        aria-label="Close"
        style:--close-width="{CLOSE_TAB.width * CLOSE_TAB_SCALE}px"
        style:--close-height="{CLOSE_TAB.height * CLOSE_TAB_SCALE}px"
        style:--close-mobile-width="{CLOSE_TAB_MOBILE.width}px"
        style:--close-mobile-height="{CLOSE_TAB_MOBILE.height}px"
        onclick={requestClose}
      >
        <svg class="tab desktop" viewBox={CLOSE_TAB.viewBox} aria-hidden="true">
          <path class="edge" d={CLOSE_TAB.edge}></path>
          <path class="face" d={CLOSE_TAB.face}></path>
        </svg>
        <svg
          class="tab mobile"
          viewBox={CLOSE_TAB_MOBILE.viewBox}
          aria-hidden="true"
        >
          <path class="edge" d={CLOSE_TAB_MOBILE.edge}></path>
          <path class="face" d={CLOSE_TAB_MOBILE.face}></path>
        </svg>
        <span>CLOSE</span>
      </button>

      <div class="content" class:player-docked={displayedId === "about"}>
        {#if displayedId === "about"}
          <div class="body">
            <AboutPanel />
          </div>
        {:else if displayedId === "projects"}
          <div class="body panel-body">
            <ProjectsPanel />
          </div>
        {:else if displayedId === "experience"}
          <div class="body panel-body">
            <ExperiencePanel />
          </div>
        {:else if displayedId === "contact"}
          <div class="body">
            <ContactPanel />
          </div>
        {/if}
      </div>
    </div>
  {/if}
  {#if showLineBar}
    <div class="line-bar" aria-hidden="true"></div>
  {/if}
</Widget>

<style>
  .dialog {
    --content-trim-left: 15px;
    --content-trim-right: 25px;
    --content-inset-right: calc(
      75px * var(--hd-scale) - var(--content-trim-right)
    );
    position: absolute;
    inset: 0;
  }

  .content {
    position: absolute;
    inset: calc(48px * var(--hd-scale)) var(--content-inset-right)
      calc(36px * var(--hd-scale))
      calc(70px * var(--hd-scale) - var(--content-trim-left));
    display: flex;
    flex-direction: column;
  }

  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-color: var(--ui-accent) transparent;
    scrollbar-width: thin;
    color: var(--ui-accent);
    font: inherit;
    font-size: var(--panel-body, 12px);
    line-height: 2;
  }

  .body::-webkit-scrollbar {
    width: 8px;
  }

  .body::-webkit-scrollbar-track {
    background: transparent;
  }

  .body::-webkit-scrollbar-thumb {
    border: 0;
    border-radius: 0;
    background: var(--ui-accent);
  }

  .body::-webkit-scrollbar-button,
  .body::-webkit-scrollbar-corner {
    display: none;
    background: transparent;
  }

  .panel-body {
    overflow-y: hidden;
    display: flex;
    flex-direction: column;
  }

  .close {
    position: absolute;
    top: calc(15px * var(--hd-scale));
    right: var(--content-inset-right);
    display: grid;
    width: var(--close-width);
    height: var(--close-height);
    padding: 0;
    border: 0;
    background: none;
    color: var(--ui-accent);
    font: inherit;
    font-size: var(--panel-label, 9px);
    letter-spacing: 1px;
    cursor: pointer;
  }

  .tab {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    shape-rendering: crispEdges;
  }

  .tab.mobile {
    display: none;
  }

  .edge {
    fill: var(--ui-accent);
  }

  .face {
    fill: var(--ui-ink);
  }

  .close span {
    position: relative;
    align-self: center;
    justify-self: end;
    padding-right: 13.5px;
  }

  .close:focus-visible {
    outline: none;
    color: var(--ui-ink);
  }

  .close:focus-visible .face {
    fill: var(--ui-accent);
  }

  .line-bar {
    position: absolute;
    inset: 0;
    background: var(--ui-highlight);
  }

  @media (max-width: 900px) {
    .content {
      inset: 44px 34px 36px;
    }

    .content.player-docked {
      bottom: calc(
        var(--mobile-panel-corner-size) + var(--mobile-player-height) + 2 *
          var(--mobile-panel-content-gap)
      );
    }

    .close {
      right: 34px;
      width: var(--close-mobile-width);
      height: var(--close-mobile-height);
      font-size: 9px;
    }

    .close::before {
      content: "";
      position: absolute;
      inset: -15px -12px -14px -12px;
    }

    .close span {
      padding-right: 13px;
    }

    .tab.desktop {
      display: none;
    }

    .tab.mobile {
      display: block;
    }

    .body {
      margin-top: 12px;
      font-size: 9px;
      line-height: 1.65;
      scrollbar-width: none;
    }

    .body::-webkit-scrollbar {
      display: none;
    }
  }
</style>
