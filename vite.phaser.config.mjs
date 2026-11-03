import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildVillageScene } from "./tools/phaser-prototype/scene-data.mjs";

const projectRoot = dirname(fileURLToPath(import.meta.url));

function villageScenePlugin() {
  const virtualId = "virtual:village-scene";
  const resolvedId = "\0" + virtualId;
  const watched = ["static/terrain.js", "static/village-content.js", "static/sprites.js"].map(
    (file) => resolve(projectRoot, file)
  );

  return {
    name: "pydungeon-village-scene",
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id !== resolvedId) return;
      watched.forEach((file) => this.addWatchFile(file));
      return "export default " + JSON.stringify(buildVillageScene(projectRoot)) + ";";
    }
  };
}

export default defineConfig({
  root: resolve(projectRoot, "tools/phaser-prototype"),
  base: "./",
  plugins: [villageScenePlugin()],
  server: {
    port: 5175,
    strictPort: true
  },
  build: {
    outDir: resolve(projectRoot, "dist/phaser-prototype"),
    emptyOutDir: true
  }
});
