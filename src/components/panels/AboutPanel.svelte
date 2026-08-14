<script lang="ts">
  import { aboutPhoto } from "./aboutPhoto";
  import DeckPlayer from "../player/DeckPlayer.svelte";
  import StickyNote from "./StickyNote.svelte";
</script>

<div class="about">
  <div class="identity">
    <img class="photo" src={aboutPhoto} alt="Portrait of me" />
    <StickyNote />
  </div>
  <div class="detail">
    <div class="text">
      <p>
        Tech guy, wannabe artist. I'm currently working as a Software Engineer
        in Carbonteq, wrestling with the dynamic world of Typescript and Web
        Development. I'm drawn to work where the answers aren't obvious and the
        rewards are real.
      </p>
      <p>
        Off the clock, I'm just a chill, performative guy who enjoys painting,
        music, and going to overpriced coffee shops. Check out my current
        playlist in this nifty iPod, and drop a few suggestions for what you
        want me to try in the contact menu!
      </p>
    </div>
    <div class="deck"><DeckPlayer /></div>
  </div>
</div>

<style>
  .about {
    --identity-width: 240px;
    --gutter: 24px;
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
    max-width: 58ch;
    font-size: 9px;
    line-height: 1.8;
  }

  .text p + p {
    margin-top: 1.8em;
  }

  .deck {
    margin-top: auto;
    min-width: 0;
  }

  @media (max-width: 1259px), (max-height: 850px) {
    .about {
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
      max-width: 72ch;
      font-size: 8px;
    }

    .text p + p {
      margin-top: 1.4em;
    }

    .deck {
      clear: both;
      margin-top: 16px;
    }
  }

  @media (max-width: 1259px) and (max-height: 850px) {
    .deck {
      display: none;
    }
  }

  @media (max-width: 900px) {
    .photo {
      width: 96px;
      margin: 2px 16px 12px 0;
    }
  }
</style>
