import { getContext, setContext } from "svelte";
import {
  createPlayerController,
  type PlayerController,
} from "./controller.svelte";
import { PLAYLIST, resolveTrack } from "./itunes";

const PLAYER_CONTEXT = Symbol("player");

export function providePlayer(): PlayerController {
  const player = createPlayerController({
    playlist: PLAYLIST,
    resolve: resolveTrack,
  });
  setContext(PLAYER_CONTEXT, player);
  return player;
}

export function playerContext(
  player: PlayerController,
): Map<symbol, PlayerController> {
  return new Map([[PLAYER_CONTEXT, player]]);
}

export function playerFromContext(): PlayerController | undefined {
  return getContext<PlayerController>(PLAYER_CONTEXT);
}

export function requirePlayer(
  player: PlayerController | undefined,
): PlayerController {
  if (!player) throw new Error("Player context is unavailable");
  return player;
}
