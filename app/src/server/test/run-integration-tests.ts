import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const databaseTestUrl = process.env.DATABASE_TEST_URL;

if (!databaseTestUrl) {
  throw new Error("DATABASE_TEST_URL is required to run integration tests.");
}

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const extraArgs = process.argv.slice(2).filter((arg) => arg !== "--");
const child = spawn(
  pnpmCommand,
  ["exec", "vitest", "run", "--config", "vitest.integration.config.ts", ...extraArgs],
  {
    cwd: appRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "test",
      DATABASE_URL: databaseTestUrl,
      DATABASE_PUBLIC_URL: databaseTestUrl,
    },
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
