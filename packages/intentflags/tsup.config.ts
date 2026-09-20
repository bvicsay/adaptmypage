import { defineConfig } from "tsup";

const shared = {
  format: ["esm", "cjs"] as const,
  dts: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target: "es2020",
  external: ["react", "react-dom"],
  esbuildOptions(options: { jsx?: string }) {
    options.jsx = "automatic";
  },
};

export default defineConfig([
  {
    ...shared,
    clean: true,
    entry: { index: "src/index.ts" },
    // The root entry contains React hooks; mark the whole bundle as a client module for RSC bundlers.
    banner: { js: '"use client";' },
    treeshake: false,
  },
  {
    ...shared,
    clean: false,
    entry: { core: "src/core/index.ts", server: "src/server/index.ts" },
  },
]);
