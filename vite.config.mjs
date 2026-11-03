import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import fs from "node:fs";
import vm from "node:vm";

const projectRoot = dirname(fileURLToPath(import.meta.url));

// Редактор читает живые данные из static/village-content.js, а не копию.
// Файл — обычный скрипт без DOM, поэтому его можно выполнить в sandbox
// и отдать редактору как виртуальный модуль.
function villageDataPlugin() {
  const virtualId = "virtual:village-data";
  const resolvedId = "\0" + virtualId;
  const source = resolve(projectRoot, "static/village-content.js");

  return {
    name: "pydungeon-village-data",
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id !== resolvedId) return;
      this.addWatchFile(source);
      const src = fs.readFileSync(source, "utf8");
      const sandbox = { console };
      vm.createContext(sandbox);
      vm.runInContext(
        src +
          "\n;globalThis.__village = {" +
          "map: VILLAGE_MAP, houses: VILLAGE_HOUSES, sealed: VILLAGE_SEALED," +
          "npcs: VILLAGE_NPCS, signs: VILLAGE_SIGNS, spawn: VILLAGE_SPAWN," +
          "tiles: VILLAGE_TILES};",
        sandbox,
        { filename: source }
      );
      return "export default " + JSON.stringify(sandbox.__village) + ";";
    }
  };
}

export default defineConfig({
  root: resolve(projectRoot, "tools/village-editor"),
  base: "./",
  plugins: [villageDataPlugin()],
  server: {
    port: 5174,
    strictPort: true
  },
  build: {
    outDir: resolve(projectRoot, "dist/village-editor"),
    emptyOutDir: true
  }
});
