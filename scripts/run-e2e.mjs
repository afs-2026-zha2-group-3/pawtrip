#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serverRoot = join(repoRoot, "apps", "server");
const backendPort = 18080;
const frontendPort = 3100;
const children = new Set();
let temporaryDirectory;
let cleanupPromise;
let requestedSignal;

function startProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: options.env ?? process.env,
    stdio: options.stdio ?? "inherit",
    detached: process.platform !== "win32",
    shell: options.shell ?? false,
  });

  child.once("error", (error) => {
    child.spawnError = error;
    children.delete(child);
  });
  child.once("close", () => children.delete(child));
  children.add(child);
  return child;
}

function runProcess(command, args, options = {}) {
  const child = startProcess(command, args, options);
  return new Promise((resolvePromise, rejectPromise) => {
    child.once("error", rejectPromise);
    child.once("close", (code, signal) => {
      resolvePromise(code ?? (signal ? 1 : 0));
    });
  });
}

function assertPortAvailable(port) {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = net.createServer();
    server.once("error", (error) => {
      rejectPromise(
        new Error(
          `E2E port ${port} is unavailable; refusing to reuse an existing service.`,
          { cause: error },
        ),
      );
    });
    server.listen(port, "127.0.0.1", () => {
      server.close((error) =>
        error ? rejectPromise(error) : resolvePromise(undefined),
      );
    });
  });
}

function verifySeededUsers(databasePath) {
  const expectedRoles = new Map([
    ["demo", "USER"],
    ["admin", "ADMIN"],
  ]);
  const database = new DatabaseSync(databasePath);

  try {
    const users = database
      .prepare("SELECT username, role FROM app_user ORDER BY username")
      .all();
    if (users.length !== expectedRoles.size || users.some((user) => expectedRoles.get(user.username) !== user.role)) {
      throw new Error("E2E seed verification failed: account count or roles are incorrect.");
    }
  } finally {
    database.close();
  }
}

function delay(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function waitForHttp(url, isReady, child, serviceName) {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    if (requestedSignal) {
      throw new Error(`Interrupted while waiting for ${serviceName}.`);
    }
    if (child.spawnError) {
      throw new Error(`Failed to start ${serviceName}.`, {
        cause: child.spawnError,
      });
    }
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`${serviceName} exited before becoming ready.`);
    }

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(1_000),
      });
      if (isReady(response)) return;
    } catch {
      // The service is still starting; retry until the bounded deadline.
    }

    await delay(400);
  }

  throw new Error(`${serviceName} did not become ready within 120 seconds.`);
}

async function waitForChild(child, milliseconds) {
  if (child.exitCode !== null || child.signalCode !== null) return true;

  return Promise.race([
    new Promise((resolvePromise) =>
      child.once("close", () => resolvePromise(true)),
    ),
    delay(milliseconds).then(() => false),
  ]);
}

async function terminateChild(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;

  if (process.platform === "win32") {
    await new Promise((resolvePromise) => {
      const killer = spawn(
        "taskkill",
        ["/PID", String(child.pid), "/T", "/F"],
        { stdio: "ignore" },
      );
      killer.once("error", resolvePromise);
      killer.once("close", resolvePromise);
    });
    await waitForChild(child, 5_000);
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    return;
  }

  if (await waitForChild(child, 5_000)) return;
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    // The process may have exited between the timeout and the signal.
  }
  await waitForChild(child, 1_000);
}

async function removeTemporaryDirectory() {
  if (!temporaryDirectory) return;

  let lastError;
  for (const delayMilliseconds of [0, 250, 500, 1_000, 2_000]) {
    if (delayMilliseconds > 0) {
      await delay(delayMilliseconds);
    }
    try {
      await rm(temporaryDirectory, { recursive: true, force: true });
      return;
    } catch (error) {
      if (error.code !== "EBUSY" && error.code !== "EPERM") {
        throw error;
      }
      lastError = error;
    }
  }
  throw lastError;
}

function cleanup() {
  if (cleanupPromise) return cleanupPromise;

  cleanupPromise = (async () => {
    for (const child of [...children].reverse()) {
      await terminateChild(child);
    }
    await removeTemporaryDirectory();
  })();

  return cleanupPromise;
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    requestedSignal = signal;
    void cleanup();
  });
}

async function main() {
  let exitCode = 1;

  try {
    await assertPortAvailable(backendPort);
    await assertPortAvailable(frontendPort);

    temporaryDirectory = await mkdtemp(join(tmpdir(), "pawtrip-e2e-"));
    const databasePath = join(temporaryDirectory, "pawtrip-e2e.db");

    const mavenCommand = process.platform === "win32" ? "mvnw.cmd" : "./mvnw";
    const backend = startProcess(mavenCommand, ["-B", "spring-boot:run"], {
      cwd: serverRoot,
      env: {
        ...process.env,
        SERVER_PORT: String(backendPort),
        SPRING_DATASOURCE_URL: `jdbc:sqlite:${databasePath}?foreign_keys=on`,
      },
      shell: process.platform === "win32",
    });

    await waitForHttp(
      `http://127.0.0.1:${backendPort}/api/auth/me`,
      (response) => response.status === 401,
      backend,
      "E2E backend",
    );

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const seedExitCode = await runProcess(
        process.execPath,
        ["scripts/seed-users.mjs", databasePath],
      );
      if (seedExitCode !== 0) {
        throw new Error(`E2E user seeding failed on run ${attempt + 1} with exit code ${seedExitCode}.`);
      }
    }
    verifySeededUsers(databasePath);

    const attractionSeedExitCode = await runProcess(
      process.execPath,
      ["scripts/seed-e2e-attractions.mjs", databasePath],
    );
    if (attractionSeedExitCode !== 0) {
      throw new Error(`E2E attraction seeding failed with exit code ${attractionSeedExitCode}.`);
    }

    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    const frontend = startProcess(
      npmCommand,
      ["run", "dev:e2e", "--workspace", "apps/web"],
      {
        env: {
          ...process.env,
          PAWTRIP_API_PROXY_TARGET: `http://127.0.0.1:${backendPort}`,
        },
        shell: process.platform === "win32",
      },
    );

    await waitForHttp(
      `http://127.0.0.1:${frontendPort}/login`,
      (response) => response.ok,
      frontend,
      "E2E frontend",
    );

    const playwrightArgs = process.argv.slice(2);
    const playwrightEnv = playwrightArgs.includes("--headed")
      ? { ...process.env, PAWTRIP_USE_SYSTEM_CHROME: "true" }
      : process.env;
    exitCode = await runProcess(
      npmCommand,
      ["run", "test:e2e:playwright", "--", ...playwrightArgs],
      { env: playwrightEnv, shell: process.platform === "win32" },
    );
  } catch (error) {
    console.error(error);
    exitCode = 1;
  } finally {
    await cleanup();
  }

  if (requestedSignal === "SIGINT") return 130;
  if (requestedSignal === "SIGTERM") return 143;
  return exitCode;
}

process.exitCode = await main();
