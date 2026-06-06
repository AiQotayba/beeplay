import { config } from "dotenv";
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(apiRoot, "../..");
const envPath = resolve(repoRoot, ".env");

if (existsSync(envPath)) {
  config({ path: envPath });
} else {
  console.error(`Missing .env at ${envPath}`);
  process.exit(1);
}

if (!process.env.DATABASE_URL?.startsWith("mysql://")) {
  console.error("DATABASE_URL must start with mysql:// (check repo root .env)");
  process.exit(1);
}

const binDir = resolve(apiRoot, "node_modules/.bin");
const tsxBin = ["tsx", "tsx.cmd", "tsx.CMD"].find((name) =>
  existsSync(resolve(binDir, name))
);

if (!tsxBin) {
  console.error("tsx not found. Run pnpm install from the repo root first.");
  process.exit(1);
}

const result = spawnSync(resolve(binDir, tsxBin), ["prisma/seed.ts"], {
  cwd: apiRoot,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
