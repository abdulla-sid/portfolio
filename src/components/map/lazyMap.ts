type MapModule = typeof import("./ExperienceMap.svelte");

let pending: Promise<MapModule> | undefined;

export function experienceMapModule(): Promise<MapModule> {
  pending ??= import("./ExperienceMap.svelte");
  return pending;
}
