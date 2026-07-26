<script lang="ts">
  import "./player-geometry.css";
  import Widget from "../../lib/Widget.svelte";
  import type { PlayerController } from "./controller.svelte";
  import { playerFromContext, requirePlayer } from "./context.svelte";
  import DesktopPlayer from "./DesktopPlayer.svelte";
  import MobilePlayer from "./MobilePlayer.svelte";

  interface Props {
    controller?: PlayerController;
    mobileVisible?: boolean;
    desktopVisible?: boolean;
  }

  let {
    controller,
    mobileVisible = true,
    desktopVisible = true,
  }: Props = $props();

  const SEGMENT_COUNT = 11;
  const contextualPlayer = playerFromContext();
  const player = $derived(requirePlayer(controller ?? contextualPlayer));

  let refresh = $state(0);
  const bumpRefresh = () => refresh++;
  document.fonts?.ready.then(bumpRefresh);
</script>

<Widget
  id="player"
  frame="double"
  mobileHidden={!mobileVisible}
  desktopHidden={!desktopVisible}
  resizable
  anchor="left: 50%; bottom: calc(var(--page-margin) + 44px); transform: translateX(-50%)"
  onResized={bumpRefresh}
>
  <DesktopPlayer {player} {refresh} segmentCount={SEGMENT_COUNT} />
  <MobilePlayer {player} segmentCount={SEGMENT_COUNT} />
</Widget>
