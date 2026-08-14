import { configDefaults, defineConfig, type Plugin } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";

const MAP_CHUNK = /^assets\/ExperienceMap-[^.]+\.js$/;

function publishMapChunkName(): Plugin {
  return {
    name: "publish-map-chunk-name",
    transformIndexHtml(_html, context) {
      const file = Object.keys(context.bundle ?? {}).find((name) =>
        MAP_CHUNK.test(name),
      );
      if (!file) return [];
      return [
        {
          tag: "meta",
          attrs: { name: "map-chunk", content: `/${file}` },
          injectTo: "head",
        },
      ];
    },
  };
}

export default defineConfig({
  plugins: [svelte(), svelteTesting(), publishMapChunkName()],
  build: {
    chunkSizeWarningLimit: 1150,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    exclude: [...configDefaults.exclude, "**/.claude/**"],
  },
});
