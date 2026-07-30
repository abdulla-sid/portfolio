<script lang="ts">
  import aboutPhoto from "../../assets/about.jpeg";
  import DeckPlayer from "../player/DeckPlayer.svelte";
</script>

<img class="photo" src={aboutPhoto} alt="Portrait of me" />
<div class="text">
  <p>
    Tech guy, wannabe artist. I'm currently working as a Software Engineer in
    Carbonteq, wrestling with the dynamic world of Typescript and Web
    Development. I'm drawn to work where the answers aren't obvious and the
    rewards are real.
  </p>
  <p>
    Off the clock, I'm just a chill, performative guy who enjoys painting,
    music, and going to overpriced coffee shops. Check out my current playlist
    in this nifty iPod, and drop a few suggestions for what you want me to try
    in the contact menu!
  </p>
</div>
<div class="deck-slot"><DeckPlayer /></div>

<style>
  .photo {
    float: left;
    width: 242px;
    height: 242px;
    margin: 4px 42px 24px 0;
    object-fit: cover;
    border: 2px solid var(--ui-accent);
  }

  .text p + p {
    margin-top: 3.2em;
  }

  .deck-slot {
    clear: both;
    margin-top: 28px;
    width: 60%;
  }

  @media (min-width: 901px) and (max-width: 1200px) {
    .photo {
      float: none;
      display: block;
      width: min(180px, 100%);
      height: auto;
      aspect-ratio: 1;
      margin: 4px auto 24px;
    }

    .text p + p {
      margin-top: 2em;
    }

    .deck-slot {
      width: 100%;
    }
  }

  @media (max-width: 900px) {
    .photo {
      width: 96px;
      height: 96px;
      margin: 2px 16px 12px 0;
    }

    .text p + p {
      margin-top: 1.6em;
    }

    .deck-slot {
      display: none;
    }
  }
</style>
