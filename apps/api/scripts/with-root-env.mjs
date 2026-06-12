import { config } from "dotenv";
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(apiRoot, "../..");

const envPath = resolve(repoRoot, ".env");

if (!existsSync(envPath)) {
  console.error(`Missing .env at ${envPath}`);
  process.exit(1);
}

config({ path: envPath, override: true });

const dbUrl = process.env.DATABASE_URL?.trim();
if (!dbUrl?.startsWith("mysql://")) {
  const preview = dbUrl
    ? dbUrl.replace(/:[^:@]+@/, ":****@").slice(0, 60)
    : "(empty or unset)";
  console.error(`DATABASE_URL must start with mysql://`);
  console.error(`File: ${envPath}`);
  console.error(`Current value: ${preview}`);
  console.error(`\nFix: nano ${envPath}`);
  console.error(`Example: DATABASE_URL="mysql://USER:PASS@127.0.0.1:3306/DATABASE"`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/with-root-env.mjs <prisma-args...>");
  process.exit(1);
}

const binDir = resolve(apiRoot, "node_modules/.bin");
const prismaBin = ["prisma.CMD", "prisma.cmd", "prisma"].find((name) =>
  existsSync(resolve(binDir, name))
);

if (!prismaBin) {
  console.error(
    "Prisma CLI not found. Run pnpm install from the repo root first."
  );
  process.exit(1);
}

const result = spawnSync(resolve(binDir, prismaBin), args, {
  cwd: apiRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

process.exit(result.status ?? 1);
