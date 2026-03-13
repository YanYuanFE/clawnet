import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    cli: "src/cli.ts",
    index: "src/index.ts",
  },
  format: ["esm"],
  target: "node20",
  platform: "node",
  splitting: false,
  sourcemap: false,
  clean: true,
  noExternal: ["@clawnet/sdk"],
  banner: {
    js: `import{createRequire}from'module';const require=createRequire(import.meta.url);`,
  },
});
