import { defineConfig, type Options } from "tsup";

const shared: Options = {
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target: "es2020",
  external: ["react", "react-dom"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
};

export default defineConfig([
  {
    ...shared,
    clean: true,
    entry: { index: "src/index.ts" },
    // The root entry contains React hooks; mark the whole bundle as a client module for RSC bundlers.
    // Rollup's treeshake pass strips module-level directives, so it is off for this entry.
    banner: { js: '"use client";' },
    treeshake: false,
  },
  {
    ...shared,
    clean: false,
    entry: { core: "src/core/index.ts", server: "src/server/index.ts" },
  },
]);
