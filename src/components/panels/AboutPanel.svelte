<script lang="ts">
  import { aboutPhoto } from "./aboutPhoto";
  import DeckPlayer from "../player/DeckPlayer.svelte";
  import StickyNote from "./StickyNote.svelte";

  const ROW_GAP = 48;
  const MIN_IDENTITY = 200;
  const MAX_IDENTITY = 460;
  const ROOMY =
    "(min-width: 1400px) and (max-width: 1999px) and (min-height: 900px)";

  let about: HTMLElement | undefined = $state();
  let deck: HTMLElement | undefined = $state();
  let copy: HTMLElement | undefined = $state();
  let identityWidth = $state(0);
  let deckHeight = $state(0);
  let rowGap = $state(0);

  $effect(() => {
    if (!about || !deck || !copy) return;
    const grid = about;
    const player = deck;
    const prose = copy;
    const roomy = window.matchMedia(ROOMY);
    let frame = 0;

    const measure = () => {
      frame = 0;
      if (!roomy.matches) {
        identityWidth = 0;
        deckHeight = 0;
        rowGap = 0;
        return;
      }
      const available = grid.clientHeight;
      const height = Math.round(player.getBoundingClientRect().height);
      const square = Math.round(
        Math.min(
          MAX_IDENTITY,
          Math.max(MIN_IDENTITY, available - ROW_GAP - height),
        ),
      );
      const upper = Math.max(
        square,
        Math.ceil(prose.getBoundingClientRect().height),
      );
      const gap = Math.max(0, Math.min(ROW_GAP, available - upper - height));
      if (height !== deckHeight) deckHeight = height;
      if (square !== identityWidth) identityWidth = square;
      if (gap !== rowGap) rowGap = gap;
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(grid);
    observer.observe(player);
    observer.observe(prose);
    roomy.addEventListener("change", schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      roomy.removeEventListener("change", schedule);
    };
  });
</script>

<div
  class="about"
  bind:this={about}
  style:--identity-width={identityWidth ? `${identityWidth}px` : null}
  style:--about-row-gap={rowGap ? `${rowGap}px` : null}
>
  <div class="identity">
    <img class="photo" src={aboutPhoto} alt="Portrait of me" />
    <StickyNote
      width={identityWidth || undefined}
      minHeight={deckHeight || undefined}
    />
  </div>
  <div class="detail">
    <div class="text" bind:this={copy}>
      <p>
        Tech guy, wannabe artist. Full-stack at Carbonteq, mostly TypeScript. I
        spend as much time deciding what to build as building it, and most of my
        free time on graphics and game engines.
      </p>
      <p>
        Off the clock I'm a chill, performative guy. I paint, sketch, skate, and
        drink more coffee than my budget should let me. I also hand-placed every
        pixel on this site. Click on the iPod for some of my favourite songs. If
        you have any recommendations, send them to me through the contact menu.
      </p>
    </div>
    <StickyNote strip />
    <div class="deck" bind:this={deck}><DeckPlayer /></div>
  </div>
</div>

<style>
  .about {
    --identity-width: 240px;
    --gutter: 24px;
    --measure: 522px;
    display: grid;
    grid-template-columns: var(--identity-width) 1fr;
    gap: var(--gutter);
    height: 100%;
  }

  .identity {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 0;
  }

  .photo {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    object-position: 50% 20%;
    border: 2px solid var(--ui-accent);
  }

  .detail {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .text {
    max-width: var(--measure);
    font-size: var(--panel-narrative);
    line-height: 1.8;
  }

  .text p + p {
    margin-top: 1.8em;
  }

  .deck {
    margin-top: auto;
    min-width: 0;
  }

  .detail :global(.note.strip) {
    display: none;
  }

  @media (max-width: 1259px), (max-height: 850px) {
    .about {
      --measure: 576px;
      display: block;
    }

    .identity {
      display: contents;
    }

    .identity :global(.note) {
      display: none;
    }

    .photo {
      float: left;
      width: 104px;
      margin: 2px 16px 8px 0;
    }

    .detail {
      display: block;
    }

    .text {
      font-size: var(--panel-narrative);
    }

    .text p + p {
      margin-top: 1.4em;
    }

    .deck {
      clear: both;
      margin-top: 16px;
    }
  }

  @media (max-width: 900px) {
    .photo {
      width: 96px;
      margin: 2px 16px 12px 0;
    }

    .deck {
      display: none;
    }
  }

  @media (min-width: 901px) and (max-width: 1259px) and (min-height: 1000px) {
    .about {
      position: relative;
    }

    .deck {
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      margin-top: 0;
    }
  }

  @media (max-width: 900px) {
    .about {
      display: flex;
      flex-direction: column;
    }

    .photo {
      float: none;
    }

    .detail {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-height: 0;
    }

    .text {
      margin-bottom: 20px;
    }

    .detail :global(.note.strip) {
      display: block;
      margin-top: auto;
    }
  }

  @media (min-width: 768px) and (max-width: 900px) and (min-height: 1024px) {
    .detail :global(.note.strip) {
      --note-strip-padding: 20px 20px 18px;
      --note-strip-heading-gap: 14px;
      --note-strip-value-size: 11px;
    }

    .deck {
      --deck-padding: 20px;
      --deck-gap: 18px;
      --deck-screen-min-height: 76px;
      --deck-screen-padding: 14px 18px;
      --deck-screen-gap: 28px;
      --deck-preset-size: 40px;
      --transport-size: 38px;
      --transport-big-size: 50px;
      display: block;
      margin-top: 20px;
    }
  }

  @media (min-width: 540px) and (max-width: 900px) and (min-height: 700px) {
    .about {
      --measure: 720px;
    }

    .photo {
      width: 200px;
      margin: 2px 24px 16px 0;
    }
  }

  @media (min-width: 901px) and (max-height: 740px) {
    .about {
      display: block;
    }

    .photo {
      width: 88px;
      margin: 2px 14px 8px 0;
    }

    .detail {
      display: block;
    }

    .text {
      line-height: 1.55;
    }

    .text p + p {
      margin-top: 1em;
    }

    .deck {
      --deck-padding: 10px;
      --deck-gap: 8px;
      --deck-screen-min-height: 40px;
      --deck-screen-padding: 6px 10px;
      --deck-screen-gap: 14px;
      --deck-preset-size: 26px;
      --transport-size: 26px;
      --transport-big-size: 34px;
      clear: both;
      margin-top: 12px;
    }
  }

  @media (min-width: 901px) and (max-width: 1200px) and (min-height: 741px) and (max-height: 850px) {
    .photo {
      width: 88px;
      margin-right: 14px;
    }

    .text {
      font-size: 9px;
      line-height: 1.6;
    }

    .text p + p {
      margin-top: 1.1em;
    }

    .deck {
      margin-top: 9px;
    }
  }

  @media (min-width: 1400px) and (max-width: 1999px) and (min-height: 900px) {
    .about {
      --gutter: 48px;
      grid-template-rows: auto auto;
      align-content: space-between;
      column-gap: var(--gutter);
      row-gap: var(--about-row-gap, var(--gutter));
    }

    .identity,
    .detail {
      display: contents;
    }

    .photo {
      grid-area: 1 / 1;
      align-self: start;
    }

    .text {
      grid-area: 1 / 2;
      align-self: start;
    }

    .identity :global(.note) {
      grid-area: 2 / 1;
      align-self: end;
    }

    .deck {
      grid-area: 2 / 2;
      align-self: end;
      margin-top: 0;
    }
  }

  @media (min-width: 2000px) {
    .detail {
      display: grid;
      grid-template-columns: minmax(450px, 620px) minmax(0, 1fr);
      gap: 32px;
    }

    .deck {
      align-self: end;
      margin-top: 0;
    }
  }
</style>
