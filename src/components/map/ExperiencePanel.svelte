<script lang="ts">
  import { EXPERIENCES } from "./experiences";
  import type { MapFocus } from "./geo";

  const mapModule = import("./ExperienceMap.svelte");

  let selectedId = $state<string | null>(null);
  let focus = $state<MapFocus | null>(null);

  function select(id: string) {
    selectedId = id;
    const entry = EXPERIENCES.find((e) => e.id === id)!;

    focus = { ...entry.location, city: entry.city };
  }
</script>

<div class="split">
  <ul class="entries">
    {#each EXPERIENCES as e (e.id)}
      <li>
        <button
          class="entry"
          class:selected={selectedId === e.id}
          type="button"
          data-no-drag
          onclick={() => select(e.id)}
        >
          <span class="role">{e.title}</span>
          <span class="org">{e.org}</span>
          <span class="dates">{e.dates}</span>
        </button>
      </li>
    {/each}
  </ul>

  <div class="map-slot">
    {#await mapModule then { default: ExperienceMap }}
      <ExperienceMap {focus} {selectedId} />
    {/await}
  </div>
</div>

<style>
  .split {
    display: flex;
    gap: calc(10px * var(--hd-scale, 2));
    height: 100%;
    min-height: 0;
  }

  .entries {
    flex: 0 0 40%;
    list-style: none;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .map-slot {
    flex: 1;
    min-width: 0;
  }

  .entry {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    border: 2px solid var(--ui-accent);
    background: var(--ui-ink);
    color: var(--ui-accent);
    font: inherit;
    font-size: 10px;
    line-height: 1.6;
    text-align: left;
    cursor: pointer;
  }

  .entry.selected {
    background: var(--ui-accent);
    color: var(--ui-ink);
  }

  .entry:focus-visible {
    outline: 2px solid var(--ui-highlight);
    outline-offset: 1px;
  }

  .role {
    font-size: 11px;
  }

  .dates {
    opacity: 0.8;
  }
</style>
