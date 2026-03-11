import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";
import { seedTavernSessionDatabase } from "./seed-tavern-session.ts";

const databaseUrl = process.env.DATABASE_TEST_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_TEST_URL is required for Tavern accessibility tests.",
  );
}

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = databaseUrl;
process.env.DATABASE_PUBLIC_URL = databaseUrl;
process.env.DATABASE_TEST_URL = databaseUrl;

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appUrlPort = Number(process.env.TAVERN_ACCESSIBILITY_PORT ?? 3111);
const appUrl = `http://127.0.0.1:${appUrlPort}`;
const chromeDebugPort = Number(process.env.TAVERN_LIGHTHOUSE_PORT ?? 9223);
const accessibilityThreshold = Number(
  process.env.TAVERN_ACCESSIBILITY_THRESHOLD ?? 90,
);
const reportDir = path.join(rootDir, "test-results", "tavern-accessibility");

interface AuditResult {
  path: string;
  score: number;
  reportPath: string;
}

function runCommand(command: string, args: string[], env?: NodeJS.ProcessEnv): void {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ...env,
    },
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim() ?? "";
    const stdout = result.stdout?.trim() ?? "";
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${stderr || stdout || "(no output)"}`,
    );
  }
}

function startAppServer(): ChildProcess {
  const child = spawn("pnpm", ["-F", "@dnd/app", "start"], {
    cwd: rootDir,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(appUrlPort),
      DATABASE_URL: databaseUrl,
      DATABASE_PUBLIC_URL: databaseUrl,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (chunk) => {
    process.stdout.write(chunk);
  });
  child.stderr?.on("data", (chunk) => {
    process.stderr.write(chunk);
  });

  return child;
}

async function waitForServerReady(url: string): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "manual",
      });

      if (response.ok || response.status === 302) {
        return;
      }
    } catch {
      // The server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url} to become ready.`);
}

function stopProcess(child: ChildProcess | null): void {
  if (!child || child.killed || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  child.kill("SIGTERM");
  const forceKillTimeout = setTimeout(() => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
    }
  }, 2_000);
  forceKillTimeout.unref();
  child.unref();
}

async function runAccessibilityAudit(targetPath: string): Promise<AuditResult> {
  const url = `${appUrl}${targetPath}`;
  const result = await lighthouse(
    url,
    {
      port: chromeDebugPort,
      output: "json",
      logLevel: "error",
      onlyCategories: ["accessibility"],
    },
  );

  const accessibilityScore = Math.round(
    ((result?.lhr.categories.accessibility.score ?? 0) * 100) * 10,
  ) / 10;

  const reportFileName = targetPath === "/"
    ? "home.accessibility.json"
    : `${targetPath.replaceAll("/", "_").replace(/^_/, "")}.accessibility.json`;
  const reportPath = path.join(reportDir, reportFileName);
  await writeFile(reportPath, result?.report ?? "", "utf8");

  return {
    path: targetPath,
    score: accessibilityScore,
    reportPath,
  };
}

async function main(): Promise<number> {
  await mkdir(reportDir, { recursive: true });
  const seededScenario = await seedTavernSessionDatabase({ databaseUrl });
  const taliPath = `/characters/${seededScenario.characterId}`;

  runCommand("pnpm", ["-F", "@dnd/app", "build"], {
    NODE_ENV: "production",
    DATABASE_URL: databaseUrl,
    DATABASE_PUBLIC_URL: databaseUrl,
  });

  let server: ChildProcess | null = null;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

  try {
    server = startAppServer();
    await waitForServerReady(`${appUrl}/`);

    browser = await chromium.launch({
      headless: true,
      args: [`--remote-debugging-port=${chromeDebugPort}`],
    });

    const results: AuditResult[] = [];
    for (const targetPath of ["/", taliPath]) {
      results.push(await runAccessibilityAudit(targetPath));
    }

    for (const result of results) {
      process.stdout.write(
        `${result.path} accessibility score: ${result.score} (report: ${result.reportPath})\n`,
      );
    }

    const failures = results.filter((result) => result.score < accessibilityThreshold);
    if (failures.length > 0) {
      throw new Error(
        `Tavern accessibility score must be at least ${accessibilityThreshold}. Failing paths: ${
          failures.map((failure) => `${failure.path}=${failure.score}`).join(", ")
        }`,
      );
    }

    return 0;
  } finally {
    if (browser) {
      await browser.close();
    }
    stopProcess(server);
  }
}

const exitCode = await main();
process.exit(exitCode);
