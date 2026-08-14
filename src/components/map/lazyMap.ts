import { lazyOnce } from "../../lib/lazyOnce";

export const experienceMapModule = lazyOnce(
  () => import("./ExperienceMap.svelte"),
);
