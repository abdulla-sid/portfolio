<script lang="ts">
  import Pager from "../../lib/Pager.svelte";
  import { EXPERIENCES } from "./experiences";

  const mapModule = import("./ExperienceMap.svelte");

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
      {#await mapModule then { default: ExperienceMap }}
        <ExperienceMap {focus} {selectedId} />
      {/await}
    </div>
  </Pager>
</div>

<style>
  .split {
    --gutter: calc(10px * var(--hd-scale, 2));
    --paddle-width: 24px;
    --paddle-height: 116px;
    --edge-trim-left: var(--content-trim-left, 0px);
    --edge-trim-right: var(--content-trim-right, 0px);
    --map-share: 0.62;
    --map-scale: 0.9;
    display: grid;
    grid-template-areas:
      "prev text map  next"
      "rail rail rail rail";
    grid-template-columns:
      calc(var(--paddle-width) + var(--edge-trim-left))
      minmax(0, 1fr)
      calc(
        (
            var(--map-share) *
              (100% - var(--edge-trim-left) - var(--edge-trim-right)) - 2 *
              var(--paddle-width) - 3 * var(--gutter)
          ) *
          var(--map-scale)
      )
      calc(var(--paddle-width) + var(--edge-trim-right));
    grid-template-rows: minmax(0, 1fr) auto;
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
  }

  .heading {
    flex: none;
  }

  h2 {
    color: var(--ui-highlight);
    font: inherit;
    font-size: 13px;
    line-height: 1.6;
  }

  .org {
    margin-top: 6px;
    color: var(--ui-accent);
    font-size: 10px;
    line-height: 1.6;
  }

  .dates {
    margin-top: 6px;
    font-size: 9px;
    line-height: 1.6;
    opacity: 0.72;
  }

  .narrative {
    flex: 1;
    min-height: 0;
    margin-top: 18px;
    padding-right: 8px;
    overflow-y: auto;
    font-size: 9px;
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
    min-width: 0;
    min-height: 0;
  }

  @media (max-width: 1100px) {
    .split {
      --gutter: 12px;
      --rail-inset: 0px;
      grid-template-areas:
        "prev text next"
        "prev map  next"
        "rail rail rail";
      grid-template-columns:
        var(--paddle-width)
        minmax(0, 1fr)
        var(--paddle-width);
      grid-template-rows: minmax(160px, 3fr) minmax(140px, 2fr) auto;
    }

    .map-slot {
      align-self: stretch;
      aspect-ratio: auto;
      margin-top: 0;
    }
  }

  @media (max-width: 900px) {
    h2 {
      font-size: 12px;
    }

    .org {
      font-size: 9px;
    }

    .dates {
      font-size: 8px;
    }

    .narrative {
      margin-top: 12px;
      font-size: 7px;
      line-height: 1.75;
    }

    .narrative p + p {
      margin-top: 10px;
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
