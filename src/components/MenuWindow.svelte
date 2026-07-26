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
  collapseY={view.collapseY}
  whiten={view.whiten}
  anchor="top: 125px; left: 500px"
>
  {#if isOpen}
    <div
      class="content"
      role="dialog"
      aria-label="{displayedLabel} window"
      tabindex="-1"
      bind:this={dialogEl}
    >
      <header>
        <span class="title">{displayedLabel}</span>
        <button
          class="close"
          type="button"
          aria-label="Close"
          onclick={requestClose}>X</button
        >
      </header>

      {#if displayedId === "about"}
        <div class="body">
          <AboutPanel />
        </div>
      {:else if displayedId === "projects"}
        <ProjectsPanel />
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
  {/if}
  {#if showLineBar}
    <div class="line-bar" aria-hidden="true"></div>
  {/if}
</Widget>

<style>
  .content {
    position: absolute;
    inset: calc(48px * var(--hd-scale)) calc(75px * var(--hd-scale))
      calc(36px * var(--hd-scale)) calc(70px * var(--hd-scale));
    display: flex;
    flex-direction: column;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .title {
    color: var(--ui-accent);
    font: inherit;
    font-size: 16px;
    letter-spacing: 1px;
  }

  .body {
    margin-top: calc(20px * var(--hd-scale));
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-color: var(--ui-accent) transparent;
    scrollbar-width: thin;
    color: var(--ui-accent);
    font: inherit;
    font-size: 12px;
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
    width: 18px;
    height: 18px;
    border: 0;
    background: var(--ui-ink);
    color: var(--ui-accent);
    font: inherit;
    font-size: 10px;
    line-height: 18px;
    cursor: pointer;
  }

  .close:focus-visible {
    outline: 2px solid var(--ui-highlight);
    outline-offset: 1px;
  }

  .line-bar {
    position: absolute;
    inset: 0;
    background: var(--ui-highlight);
  }

  @media (max-width: 900px) {
    .content {
      inset: 44px 34px 158px;
    }

    header {
      padding-right: 0;
    }

    .close {
      flex: 0 0 36px;
      width: 36px;
      height: 36px;
      border: 0;
      background: transparent;
      font-size: 11px;
      line-height: 36px;
    }

    .title {
      font-size: 11px;
    }

    .body {
      margin-top: 30px;
      font-size: 9px;
      line-height: 1.65;
      scrollbar-width: none;
    }

    .body::-webkit-scrollbar {
      display: none;
    }
  }
</style>
