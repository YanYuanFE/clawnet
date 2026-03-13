import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  splitting: false,
  sourcemap: false,
  clean: true,
  banner: {
    js: `import{createRequire}from'module';const require=createRequire(import.meta.url);`,
  },
});
