import * as esbuild from "esbuild";
import { mkdirSync } from "fs";

mkdirSync("api", { recursive: true });

await esbuild.build({
  entryPoints: ["scripts/vercel-entry.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "api/index.js",
  sourcemap: true,
  packages: "bundle",
  external: ["@prisma/client", ".prisma", "prisma"],
  logLevel: "info",
});

console.log("Vercel API bundle written to api/index.js");
