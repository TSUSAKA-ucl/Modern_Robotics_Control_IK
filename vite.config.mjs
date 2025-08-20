import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    target: 'esnext',
    lib: {
      entry: resolve(__dirname, "worker/worker.js"),
      name: "WorkerBundle",
      formats: ["es"], // web worker なら ESM が安全
      fileName: () => "worker.js",
    },
    outDir: "public", // 出力先を public にする
    emptyOutDir: false, // 既存の public を消さない
    rollupOptions: {
      external: [
	'/wasm/slrm_module.js',
	'/wasm/cd_module.js',
      ]
    }
  },
  publicDir: false, // viteがコピー対象にするpublicDirは無い
});
