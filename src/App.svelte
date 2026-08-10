<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import "./tokens.css";
  import Title from "./components/Title.svelte";
  import Footer from "./components/Footer.svelte";
  import Menu from "./components/menu/Menu.svelte";
  import DaveWidget from "./components/DaveWidget.svelte";
  import MenuWindow from "./components/MenuWindow.svelte";
  import PlayerWidget from "./components/player/PlayerWidget.svelte";
  import Background from "./components/Background.svelte";
  import RotateNotice from "./components/RotateNotice.svelte";
  import { providePlayer } from "./components/player/context.svelte";
  import { preloadFrameArt } from "./lib/widget/frame";
  import type { MenuId } from "./app/menu";

  const player = providePlayer();
  onDestroy(() => player.dispose());

  onMount(preloadFrameArt);

  let activeMenuId: MenuId | null = $state(null);
  let aboutPlayerVisible = $state(false);

  function onCommit(id: MenuId) {
    aboutPlayerVisible = false;
    activeMenuId = id;
  }
</script>

<Background />

<div class="scene">
  <Title />
  <Menu {onCommit} windowOpen={activeMenuId !== null} />
  <main>
    <DaveWidget />
    {#if activeMenuId !== null}
      <MenuWindow
        id={activeMenuId}
        onOpened={() => {
          aboutPlayerVisible = activeMenuId === "about";
          if (aboutPlayerVisible) player.initialize();
        }}
        onClosing={() => {
          aboutPlayerVisible = false;
        }}
        onClosed={() => {
          aboutPlayerVisible = false;
          activeMenuId = null;
        }}
      />
    {/if}
    <PlayerWidget mobileVisible={aboutPlayerVisible} desktopVisible={false} />
  </main>
  <Footer />
</div>

<RotateNotice />

<style>
  .scene {
    position: fixed;
    inset: 0;
    z-index: 1;
  }

  @media (pointer: coarse) and (orientation: landscape) and (max-height: 500px) {
    .scene {
      display: none;
    }
  }
</style>
