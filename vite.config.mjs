import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(projectRoot, "tools/village-editor"),
  base: "./",
  server: {
    port: 5174,
    strictPort: true
  },
  build: {
    outDir: resolve(projectRoot, "dist/village-editor"),
    emptyOutDir: true
  }
});
