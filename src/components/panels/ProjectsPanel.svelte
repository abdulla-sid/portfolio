<script lang="ts">
  import Pager from "../../lib/Pager.svelte";
  import { PROJECTS } from "./projects";

  let activeIndex = $state(0);

  const activeProject = $derived(PROJECTS[activeIndex]);
</script>

<div class="split" class:has-media={activeProject.image}>
  <Pager
    count={PROJECTS.length}
    bind:index={activeIndex}
    itemLabel="project"
    announcement="{activeProject.title}, {activeProject.context}, {activeProject.dates}"
  >
    <section class="page" aria-label="Project details">
      <div class="heading">
        <h2>{activeProject.title}</h2>
        <p class="context">{activeProject.context}</p>
        <p class="dates">{activeProject.dates}</p>
      </div>

      <p class="impact">{activeProject.impact}</p>

      <div class="narrative">
        {#each activeProject.narrative as paragraph}
          <p>{paragraph}</p>
        {/each}
      </div>

      <ul class="stack">
        {#each activeProject.stack as item}
          <li>{item}</li>
        {/each}
      </ul>
    </section>

    {#if activeProject.image}
      <div class="media-slot">
        <img src={activeProject.image} alt={activeProject.imageAlt} />
      </div>
    {/if}
  </Pager>
</div>

<style>
  .split {
    --gutter: calc(10px * var(--hd-scale, 2));
    --paddle-width: var(--pager-paddle-width);
    --paddle-height: var(--pager-paddle-height);
    --paddle-hit-extension: var(--pager-paddle-hit-extension);
    --paddle-strip: calc(
      var(--paddle-width) + var(--pager-paddle-strip-gap, var(--gutter))
    );
    --paddle-offset: calc(
      var(--paddle-width) + var(--pager-paddle-offset-extra, 0px)
    );
    display: grid;
    grid-template-areas:
      "text"
      "rail";
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    gap: var(--gutter);
    padding-inline: var(--paddle-strip);
    height: 100%;
    min-height: 0;
  }

  .split.has-media {
    grid-template-areas:
      "text media"
      "rail rail";
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .media-slot {
    display: flex;
    grid-area: media;
    align-self: center;
    min-width: 0;
    min-height: 0;
    max-height: calc(100cqh - 60px);
    overflow: hidden;
  }

  .media-slot img {
    width: 100%;
    height: auto;
    max-height: 100%;
    border: 2px solid var(--ui-accent);
    object-fit: cover;
    object-position: 50% 35%;
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

  .context {
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

  .impact {
    flex: none;
    margin-top: 14px;
    color: var(--ui-highlight);
    font-size: var(--panel-narrative);
    line-height: 1.8;
  }

  .narrative {
    flex: 1;
    min-height: 0;
    margin-top: 14px;
    padding-right: 8px;
    overflow-y: auto;
    overflow-wrap: break-word;
    font-size: var(--panel-narrative);
    line-height: 1.8;
    scrollbar-color: var(--ui-accent) transparent;
    scrollbar-width: thin;
    mask-image: linear-gradient(
      to bottom,
      var(--mask-opaque) 0,
      var(--mask-opaque) calc(100% - 10px),
      transparent 100%
    );
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

  .stack {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 14px;
    padding-right: 8px;
    list-style: none;
  }

  .stack li {
    padding: 4px 7px;
    border: 2px solid var(--ui-accent-deep);
    font-size: var(--panel-chip);
    line-height: 1.4;
    letter-spacing: 1px;
  }

  @media (max-width: 1100px) {
    .split {
      --gutter: 12px;
    }

    .split.has-media {
      grid-template-areas:
        "text"
        "media"
        "rail";
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(140px, 3fr) minmax(110px, 2fr) auto;
    }

    .media-slot {
      align-self: stretch;
    }

    .media-slot img {
      height: 100%;
    }
  }

  @media (max-width: 1100px) and (max-height: 740px) {
    .split {
      --gutter: 10px;
    }

    .split.has-media {
      grid-template-rows: minmax(90px, 3fr) minmax(80px, 2fr) auto;
    }
  }

  @media (max-width: 430px) {
    .split.has-media {
      grid-template-areas:
        "text"
        "rail";
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr) auto;
    }

    .media-slot {
      display: none;
    }
  }

  @container panel-body (max-width: 650px) and (max-height: 650px) {
    .split.has-media {
      grid-template-areas:
        "text"
        "rail";
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr) auto;
    }

    .media-slot {
      display: none;
    }
  }
</style>
