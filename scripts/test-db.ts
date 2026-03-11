import { spawnSync } from "node:child_process";

type Command = "up" | "env" | "status" | "down";

interface TestDbConfig {
  containerName: string;
  image: string;
  hostPort: string;
  databaseName: string;
  username: string;
  password: string;
}

const config: TestDbConfig = {
  containerName: process.env.DND_TEST_DB_CONTAINER ?? "dnd-tavern-test",
  image: process.env.DND_TEST_DB_IMAGE ?? "postgres:16-alpine",
  hostPort: process.env.DND_TEST_DB_PORT ?? "55433",
  databaseName: process.env.DND_TEST_DB_NAME ?? "dnd_tavern_test",
  username: process.env.DND_TEST_DB_USER ?? "postgres",
  password: process.env.DND_TEST_DB_PASSWORD ?? "postgres",
};

const command = parseCommand(process.argv[2]);

function parseCommand(value: string | undefined): Command {
  switch (value) {
    case undefined:
    case "up":
    case "env":
    case "status":
    case "down":
      return value ?? "up";
    default:
      throw new Error(
        `Unknown command "${value}". Use one of: up, env, status, down.`,
      );
  }
}

function runDocker(
  args: string[],
  options?: {
    allowFailure?: boolean;
    quiet?: boolean;
  },
): string {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    throw new Error(
      "Docker is required for the disposable test database. Install Docker Desktop or ensure the docker CLI is on PATH.",
    );
  }

  const stdout = result.stdout?.trim() ?? "";
  const stderr = result.stderr?.trim() ?? "";

  if (result.status !== 0 && !options?.allowFailure) {
    const details = stderr || stdout || "(no output)";
    throw new Error(`docker ${args.join(" ")} failed:\n${details}`);
  }

  if (!options?.quiet && stderr) {
    process.stderr.write(`${stderr}\n`);
  }

  return stdout;
}

function runPnpm(
  args: string[],
  options?: {
    env?: NodeJS.ProcessEnv;
  },
): void {
  const result = spawnSync("pnpm", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ...options?.env,
    },
  });

  if (result.error) {
    throw new Error(
      "pnpm is required to run test database migrations. Ensure pnpm is installed and on PATH.",
    );
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim() ?? "";
    const stdout = result.stdout?.trim() ?? "";
    const details = stderr || stdout || "(no output)";
    throw new Error(`pnpm ${args.join(" ")} failed:\n${details}`);
  }
}

function checkDockerAvailable(): void {
  runDocker(["info"], { quiet: true });
}

function containerExists(): boolean {
  return (
    runDocker(
      ["ps", "-a", "--filter", `name=^/${config.containerName}$`, "--format", "{{.ID}}"],
      { quiet: true },
    ) !== ""
  );
}

function containerIsRunning(): boolean {
  if (!containerExists()) {
    return false;
  }

  return (
    runDocker(
      ["inspect", "--format", "{{.State.Running}}", config.containerName],
      { quiet: true },
    ) === "true"
  );
}

function resolveHostPort(): string {
  const portOutput = runDocker(
    ["port", config.containerName, "5432/tcp"],
    { quiet: true },
  );
  const firstLine = portOutput.split("\n")[0]?.trim();

  if (!firstLine) {
    throw new Error(
      `Container ${config.containerName} is running but has no published Postgres port.`,
    );
  }

  const hostPort = firstLine.split(":").pop()?.trim();
  if (!hostPort) {
    throw new Error(`Could not parse published port from "${firstLine}".`);
  }

  return hostPort;
}

function buildDatabaseUrl(hostPort: string): string {
  return `postgresql://${config.username}:${config.password}@127.0.0.1:${hostPort}/${config.databaseName}`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPostgres(): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const result = spawnSync(
      "docker",
      [
        "exec",
        config.containerName,
        "pg_isready",
        "-U",
        config.username,
        "-d",
        config.databaseName,
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "ignore", "ignore"],
      },
    );

    if (result.status === 0) {
      return;
    }

    await sleep(500);
  }

  throw new Error(
    `Postgres in ${config.containerName} did not become ready in time.`,
  );
}

async function ensureRunning(): Promise<string> {
  checkDockerAvailable();

  if (!containerExists()) {
    runDocker([
      "run",
      "-d",
      "--name",
      config.containerName,
      "-p",
      `${config.hostPort}:5432`,
      "-e",
      `POSTGRES_USER=${config.username}`,
      "-e",
      `POSTGRES_PASSWORD=${config.password}`,
      "-e",
      `POSTGRES_DB=${config.databaseName}`,
      config.image,
    ]);
  } else if (!containerIsRunning()) {
    runDocker(["start", config.containerName]);
  }

  await waitForPostgres();
  return buildDatabaseUrl(resolveHostPort());
}

function migrateDatabase(databaseUrl: string): void {
  runPnpm(["-F", "@dnd/app", "db:migrate"], {
    env: {
      DATABASE_TEST_URL: databaseUrl,
      DATABASE_URL: databaseUrl,
      DATABASE_PUBLIC_URL: databaseUrl,
    },
  });
}

async function printEnv(): Promise<void> {
  const databaseUrl = await ensureRunning();
  process.stdout.write(`export DATABASE_TEST_URL='${databaseUrl}'\n`);
  process.stdout.write(`export DATABASE_URL='${databaseUrl}'\n`);
  process.stdout.write(`export DATABASE_PUBLIC_URL='${databaseUrl}'\n`);
}

function printStatus(): void {
  checkDockerAvailable();

  if (!containerExists()) {
    process.stdout.write(
      [
        "Disposable test database is not running.",
        `Container: ${config.containerName}`,
        `Image: ${config.image}`,
        `Desired port: ${config.hostPort}`,
        "Start it with: pnpm db:test:up",
      ].join("\n") + "\n",
    );
    return;
  }

  const running = containerIsRunning();
  const hostPort = running ? resolveHostPort() : config.hostPort;
  const databaseUrl = buildDatabaseUrl(hostPort);

  process.stdout.write(
    [
      `Container: ${config.containerName}`,
      `Running: ${running ? "yes" : "no"}`,
      `Image: ${config.image}`,
      `Host port: ${hostPort}`,
      `Database: ${config.databaseName}`,
      `URL: ${databaseUrl}`,
      running
        ? 'Shell exports: eval "$(pnpm db:test:env)"'
        : "Start it with: pnpm db:test:up",
    ].join("\n") + "\n",
  );
}

function removeContainer(): void {
  checkDockerAvailable();

  if (!containerExists()) {
    process.stdout.write(
      `Disposable test database ${config.containerName} is already absent.\n`,
    );
    return;
  }

  runDocker(["rm", "-f", config.containerName], { quiet: true });
  process.stdout.write(
    `Removed disposable test database ${config.containerName}.\n`,
  );
}

async function startContainer(): Promise<void> {
  const databaseUrl = await ensureRunning();
  migrateDatabase(databaseUrl);
  process.stdout.write(
    [
      "Disposable Postgres is ready.",
      `Container: ${config.containerName}`,
      `Image: ${config.image}`,
      `URL: ${databaseUrl}`,
      "Schema: migrated",
      'Run `eval "$(pnpm db:test:env)"` to export DATABASE_TEST_URL in your shell.',
      "Stop and remove it with `pnpm db:test:down`.",
    ].join("\n") + "\n",
  );
}

switch (command) {
  case "up":
    await startContainer();
    break;
  case "env":
    await printEnv();
    break;
  case "status":
    printStatus();
    break;
  case "down":
    removeContainer();
    break;
}
