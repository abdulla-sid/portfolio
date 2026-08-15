<script lang="ts">
  import Pager from "../../lib/Pager.svelte";
  import { EXPERIENCES } from "./experiences";
  import { experienceMapModule } from "./lazyMap";

  let mapModule = $state(experienceMapModule());

  let activeIndex = $state(0);

  const activeExperience = $derived(EXPERIENCES[activeIndex]);
  const selectedId = $derived(activeExperience.id);
  const focus = $derived({
    ...activeExperience.location,
    city: activeExperience.city,
  });
</script>

<div class="split">
  <Pager
    count={EXPERIENCES.length}
    bind:index={activeIndex}
    itemLabel="experience"
    announcement="{activeExperience.title}, {activeExperience.org}, {activeExperience.dates}"
  >
    <section class="page" aria-label="Experience details">
      <div class="heading">
        <h2>{activeExperience.title}</h2>
        <p class="org">{activeExperience.org}</p>
        <p class="dates">{activeExperience.dates}</p>
      </div>

      <div class="narrative">
        {#each activeExperience.narrative as paragraph}
          <p>{paragraph}</p>
        {/each}
      </div>
    </section>

    <div class="map-slot">
      {#await mapModule}
        <div class="map-pending" aria-hidden="true">
          <span>LOADING MAP</span>
        </div>
      {:then { default: ExperienceMap }}
        <ExperienceMap {focus} {selectedId} />
      {:catch}
        <div class="map-pending">
          <button
            type="button"
            onclick={() => (mapModule = experienceMapModule())}
          >
            MAP DID NOT LOAD — RETRY
          </button>
        </div>
      {/await}
    </div>
  </Pager>
</div>

<style>
  .split {
    --gutter: calc(10px * var(--hd-scale, 2));
    --paddle-width: 18px;
    --paddle-height: 116px;
    --paddle-strip: calc(var(--paddle-width) + var(--gutter));
    --map-share: 0.62;
    --map-scale: 0.9;
    display: grid;
    grid-template-areas:
      "text map"
      "rail rail";
    grid-template-columns:
      minmax(0, 1fr)
      calc(
        (var(--map-share) * (100% - var(--gutter)) - 2 * var(--paddle-strip)) *
          var(--map-scale)
      );
    grid-template-rows: minmax(0, 1fr) auto;
    padding-inline: var(--paddle-strip);
    gap: var(--gutter);
    height: 100%;
    min-height: 0;
  }

  .page {
    display: flex;
    grid-area: text;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    color: var(--text-primary);
    overflow-wrap: break-word;
  }

  .heading {
    flex: none;
  }

  h2 {
    color: var(--ui-highlight);
    font: inherit;
    font-size: var(--panel-heading);
    line-height: 1.6;
  }

  .org {
    margin-top: 6px;
    color: var(--ui-accent);
    font-size: var(--panel-sub);
    line-height: 1.6;
  }

  .dates {
    margin-top: 6px;
    font-size: var(--panel-meta);
    line-height: 1.6;
    opacity: 0.72;
  }

  .narrative {
    flex: 1;
    min-height: 0;
    margin-top: 18px;
    padding-right: 8px;
    overflow-y: auto;
    overflow-wrap: break-word;
    font-size: var(--panel-narrative);
    line-height: 1.8;
    scrollbar-color: var(--ui-accent) transparent;
    scrollbar-width: thin;
  }

  .narrative p + p {
    margin-top: 12px;
  }

  .narrative::-webkit-scrollbar {
    width: 5px;
  }

  .narrative::-webkit-scrollbar-track {
    background: transparent;
  }

  .narrative::-webkit-scrollbar-thumb {
    background: var(--ui-accent);
  }

  .map-slot {
    grid-area: map;
    align-self: center;
    aspect-ratio: 1;
    margin-top: var(--gutter);
    max-height: 100%;
    min-width: 0;
    min-height: 0;
  }

  .map-pending {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    border: 2px solid var(--ui-accent-deep);
    background: var(--surface-page);
    color: var(--text-muted);
    font-size: 8px;
    letter-spacing: 1px;
  }

  .map-pending button {
    border: 2px solid var(--ui-accent);
    background: none;
    padding: 10px 14px;
    color: var(--ui-accent);
    font: inherit;
    font-size: 8px;
    letter-spacing: 1px;
    cursor: pointer;
  }

  @media (max-width: 1100px) {
    .split {
      --gutter: 12px;
      grid-template-areas:
        "text"
        "map"
        "rail";
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(160px, 3fr) minmax(140px, 2fr) auto;
    }

    .map-slot {
      align-self: stretch;
      aspect-ratio: auto;
      margin-top: 0;
    }
  }

  @media (max-width: 1100px) and (max-height: 740px) {
    .split {
      --gutter: 10px;
      --paddle-height: 80px;
      grid-template-rows: minmax(100px, 3fr) minmax(90px, 2fr) auto;
    }
  }
</style>
