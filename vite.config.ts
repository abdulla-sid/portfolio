import { configDefaults, defineConfig, type Plugin } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";

const MAP_ASSETS = [
  { meta: "map-chunk", pattern: /^assets\/ExperienceMap-[^.]+\.js$/ },
  { meta: "map-style", pattern: /^assets\/ExperienceMap-[^.]+\.css$/ },
];

function publishMapAssetNames(): Plugin {
  return {
    name: "publish-map-asset-names",
    apply: "build",
    transformIndexHtml(_html, context) {
      const bundled = Object.keys(context.bundle ?? {});

      return MAP_ASSETS.map(({ meta, pattern }) => {
        const file = bundled.find((name) => pattern.test(name));
        if (!file)
          throw new Error(
            `No bundled file matched ${pattern.source}. The map cannot be warmed until this pattern matches Vite's output again.`,
          );
        return {
          tag: "meta",
          attrs: { name: meta, content: `/${file}` },
          injectTo: "head" as const,
        };
      });
    },
  };
}

export default defineConfig({
  plugins: [svelte(), svelteTesting(), publishMapAssetNames()],
  build: {
    chunkSizeWarningLimit: 1150,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    exclude: [...configDefaults.exclude, "**/.claude/**"],
  },
});
