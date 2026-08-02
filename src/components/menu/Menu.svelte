<script lang="ts">
  import { onDestroy } from "svelte";
  import { MENU_ITEMS, type MenuId } from "../../app/menu";
  import { prefersReducedMotion } from "../../lib/motion";
  import { createMenuMachine, type MenuState } from "./machine";

  interface Props {
    onCommit?: (id: MenuId) => void;

    windowOpen?: boolean;
  }
  let { onCommit, windowOpen = false }: Props = $props();

  const WAKE_KEYS = ["ArrowDown", "ArrowUp", " ", "Enter"];
  const EXTERNAL_CONTROL =
    "button, a, input, textarea, select, [contenteditable]:not([contenteditable=false])";
  const reduceMotion = prefersReducedMotion();

  let menuState: MenuState | null = $state(null);
  let buttons = $state<HTMLButtonElement[]>([]);
  let mobileOpen = $state(false);
  let commitTimer: ReturnType<typeof setTimeout> | undefined;

  const machine = createMenuMachine(
    MENU_ITEMS.length,
    (s) => {
      menuState = s;
    },
    reduceMotion ? 0 : undefined,
  );

  function commit(index: number) {
    onCommit?.(MENU_ITEMS[index].id);
  }

  function focusedIndex(): number {
    return buttons.findIndex((b) => b === document.activeElement);
  }

  function onKeydown(e: KeyboardEvent) {
    const target = e.target instanceof Element ? e.target : null;
    const fromMenu = target?.closest(".menu-item") !== null;
    const fromExternalControl =
      !fromMenu && target?.closest(EXTERNAL_CONTROL) !== null;

    if (
      e.defaultPrevented ||
      e.isComposing ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey ||
      fromExternalControl ||
      (windowOpen && !fromMenu)
    )
      return;

    if (e.key === "Escape") {
      if (windowOpen) return;
      if (focusedIndex() >= 0) (document.activeElement as HTMLElement).blur();
      machine.escape();
      return;
    }

    const active = Math.max(focusedIndex(), machine.state()?.index ?? -1);

    if (e.key === "Enter") {
      e.preventDefault();
      const s = machine.state();
      if (s?.phase === "selected") {
        commit(s.index);
      } else if (active === -1) {
        machine.activate(0);
        buttons[0]?.focus();
      }
      return;
    }

    if (active === -1) {
      if (!WAKE_KEYS.includes(e.key)) return;
      e.preventDefault();
      machine.activate(0);
      buttons[0]?.focus();
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = machine.move(e.key === "ArrowDown" ? 1 : -1, focusedIndex());
      buttons[next]?.focus();
    }
  }

  function onClick(i: number) {
    machine.activate(i);
    mobileOpen = false;
    clearTimeout(commitTimer);
    commitTimer = setTimeout(() => commit(i), reduceMotion ? 0 : 120);
  }

  onDestroy(() => {
    clearTimeout(commitTimer);
    machine.dispose();
  });
</script>

<svelte:document onkeydown={onKeydown} />

<button
  class="mobile-toggle"
  type="button"
  aria-label="Toggle navigation"
  aria-expanded={mobileOpen}
  onclick={() => (mobileOpen = !mobileOpen)}><i></i><i></i><i></i></button
>

<nav
  aria-label="Menu"
  class:mobile-open={mobileOpen}
  class:mobile-has-selection={menuState !== null}
>
  {#each MENU_ITEMS as item, i}
    <button
      bind:this={buttons[i]}
      class="menu-item"
      class:is-line={menuState?.index === i && menuState.phase === "line"}
      class:is-flash={menuState?.index === i && menuState.phase === "flash"}
      class:is-selected={menuState?.index === i &&
        menuState.phase === "selected"}
      aria-pressed={menuState?.index === i && menuState.phase === "selected"}
      type="button"
      onclick={() => onClick(i)}><span>{item.label}</span></button
    >
  {/each}
</nav>

<style>
  .mobile-toggle {
    display: none;
  }

  nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: var(--page-margin);
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: min(330px, 44vw);
  }

  .menu-item {
    position: relative;
    z-index: 0;
    border: 0;
    background: none;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    font-size: 14.3px;
    letter-spacing: 1px;
    color: var(--ui-accent);
    padding: 10.2px 17.6px 10.2px 37.4px;
  }

  .menu-item:focus {
    outline: none;
  }

  .menu-item::before,
  .menu-item::after {
    content: "";
    position: absolute;
    display: none;
  }
  .menu-item::before {
    left: 0;
    width: 13.2px;
  }
  .menu-item::after {
    left: 13.2px;
    right: 0;
  }

  .menu-item.is-line::before,
  .menu-item.is-line::after {
    display: block;
    top: 50%;
    height: 5.28px;
    transform: translateY(-50%);
    z-index: 1;
  }
  .menu-item.is-line::before {
    background: var(--text-muted);
    left: -6%;
  }
  .menu-item.is-line::after {
    background: var(--ui-highlight);
    left: calc(-6% + 13.2px);
    right: -26%;
  }

  .menu-item.is-flash::before,
  .menu-item.is-flash::after,
  .menu-item.is-selected::before,
  .menu-item.is-selected::after {
    display: block;
    z-index: -1;
  }
  .menu-item.is-flash::before,
  .menu-item.is-flash::after {
    top: -1.75%;
    height: 103.5%;
  }
  .menu-item.is-selected::before,
  .menu-item.is-selected::after {
    top: -13.25%;
    height: 126.5%;
  }
  .menu-item.is-flash,
  .menu-item.is-selected {
    color: var(--ui-ink);
  }
  .menu-item.is-flash::before {
    background: var(--text-muted);
  }
  .menu-item.is-flash::after {
    background: var(--ui-highlight);
  }
  .menu-item.is-selected::before {
    background: var(--ui-accent-deep);
  }
  .menu-item.is-selected::after {
    background: var(--ui-accent);
    right: -10%;
  }

  @media (max-width: 900px) {
    .mobile-toggle {
      position: fixed;
      top: calc(20px + var(--safe-top));
      right: 20px;
      z-index: 2001;
      display: flex;
      width: 44px;
      height: 44px;
      padding: 8px;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      border: 0;
      background: transparent;
      color: var(--ui-accent);
    }

    .mobile-toggle i {
      display: block;
      width: 28px;
      height: 4px;
      background: currentColor;
    }

    nav {
      position: fixed;
      top: calc(84px + var(--safe-top));
      right: 0;
      left: 0;
      z-index: 2000;
      width: auto;
      transform: none;
      display: none;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2px;
      border: 2px solid var(--ui-accent-deep);
      background: var(--ui-ink);
    }

    nav.mobile-open {
      display: grid;
      right: 14px;
      left: 14px;
    }

    nav.mobile-has-selection:not(.mobile-open) {
      display: block;
    }

    nav:not(.mobile-open)
      .menu-item:not(.is-line):not(.is-flash):not(.is-selected) {
      display: none;
    }

    .menu-item {
      min-height: 54px;
      padding: 8px 10px;
      border: 1px solid var(--ui-accent-deep);
      font-size: 8px;
      line-height: 1.5;
      text-align: center;
    }

    nav:not(.mobile-open) .menu-item {
      width: 100%;
      min-height: 32px;
      padding: 5px 30px;
      text-align: left;
    }

    .menu-item.is-line::before,
    .menu-item.is-line::after {
      top: 50%;
      height: 4px;
    }

    .menu-item.is-line::before {
      left: 0;
      width: 12px;
    }

    .menu-item.is-line::after {
      right: 0;
      left: 12px;
    }

    .menu-item.is-flash::before,
    .menu-item.is-flash::after,
    .menu-item.is-selected::before,
    .menu-item.is-selected::after {
      top: 0;
      height: 100%;
    }

    .menu-item.is-flash::before,
    .menu-item.is-selected::before {
      left: 0;
      width: 12px;
    }

    .menu-item.is-flash::after,
    .menu-item.is-selected::after {
      right: 0;
      left: 12px;
    }
  }
</style>
