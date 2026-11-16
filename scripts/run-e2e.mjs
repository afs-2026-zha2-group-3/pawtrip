#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serverRoot = join(repoRoot, "apps", "server");
const mainDatabasePath = join(serverRoot, "data", "pawtrip.db");
const backendPort = 18080;
const frontendPort = 3100;
const maxWorkers = 8;
const requestedWorkers = Number(
  process.env.PAWTRIP_E2E_WORKERS ?? (process.env.CI ? 2 : 4),
);
const workerCount = Math.min(
  Number.isInteger(requestedWorkers) && requestedWorkers > 0
    ? requestedWorkers
    : 1,
  maxWorkers,
);
const children = new Set();
let temporaryDirectory;
let cleanupPromise;
let requestedSignal;

function fingerprintFile(path) {
  try {
    return createHash("sha256").update(readFileSync(path)).digest("hex");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

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
    ["petowner", "USER"],
    ...Array.from({ length: workerCount }, (_, index) => [
      `petowner-w${index}`,
      "USER",
    ]),
  ]);
  const database = new DatabaseSync(databasePath);

  try {
    const users = database
      .prepare("SELECT username, role FROM app_user")
      .all();
    for (const [username, role] of expectedRoles) {
      if (!users.some((user) => user.username === username && user.role === role)) {
        throw new Error(
          `E2E seed verification failed: ${username} (${role}) is missing.`,
        );
      }
    }

    const petOwners = database
      .prepare(
        `SELECT u.username AS username, COUNT(p.id) AS petCount
         FROM app_user u
         LEFT JOIN pet p ON p.user_id = u.id
         WHERE u.username = 'petowner' OR u.username LIKE 'petowner-w%'
         GROUP BY u.id`,
      )
      .all();
    if (
      petOwners.length !== workerCount + 1 ||
      petOwners.some((owner) => owner.petCount !== 2)
    ) {
      throw new Error(
        "E2E seed verification failed: pet owner accounts must each own 2 pets.",
      );
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
  const mainDatabaseBefore = fingerprintFile(mainDatabasePath);

  try {
    await assertPortAvailable(backendPort);
    await assertPortAvailable(frontendPort);

    temporaryDirectory = await mkdtemp(join(tmpdir(), "pawtrip-e2e-"));
    const databasePath = join(temporaryDirectory, "pawtrip-e2e.db");
    console.log(`[e2e] 临时数据库: ${databasePath}`);
    console.log(`[e2e] Playwright workers: ${workerCount}`);

    const mavenCommand = process.platform === "win32" ? "mvnw.cmd" : "./mvnw";
    const backend = startProcess(mavenCommand, ["-B", "spring-boot:run"], {
      cwd: serverRoot,
      env: {
        ...process.env,
        SERVER_PORT: String(backendPort),
        // SQLite 只允许一个写者；E2E 临时库用单连接池串行化访问，避免并发事务的锁升级死锁。
        SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE: "1",
        SPRING_DATASOURCE_URL: `jdbc:sqlite:${databasePath}?foreign_keys=on&busy_timeout=10000`,
      },
      shell: process.platform === "win32",
    });

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

    await Promise.all([
      waitForHttp(
        `http://127.0.0.1:${backendPort}/api/auth/me`,
        (response) => response.status === 401,
        backend,
        "E2E backend",
      ),
      waitForHttp(
        `http://127.0.0.1:${frontendPort}/login`,
        (response) => response.ok,
        frontend,
        "E2E frontend",
      ),
    ]);

    const seedExitCode = await runProcess(
      process.execPath,
      ["scripts/seed-users.mjs", databasePath],
      {
        env: { ...process.env, SEED_E2E_WORKERS: String(workerCount) },
      },
    );
    if (seedExitCode !== 0) {
      throw new Error(`E2E user seeding failed with exit code ${seedExitCode}.`);
    }
    verifySeededUsers(databasePath);

    const attractionSeedExitCode = await runProcess(
      process.execPath,
      ["scripts/seed-e2e-attractions.mjs", databasePath],
    );
    if (attractionSeedExitCode !== 0) {
      throw new Error(`E2E attraction seeding failed with exit code ${attractionSeedExitCode}.`);
    }

    const playwrightArgs = process.argv.slice(2);
    const playwrightEnv = {
      ...process.env,
      PAWTRIP_E2E_WORKERS: String(workerCount),
      // 供测试用例直连临时库配置城市政策等无法经 API 维护的数据
      PAWTRIP_E2E_DB_PATH: databasePath,
      ...(playwrightArgs.includes("--headed") ? { PAWTRIP_USE_SYSTEM_CHROME: "true" } : {}),
    };
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
    const mainDatabaseAfter = fingerprintFile(mainDatabasePath);
    if (mainDatabaseBefore === mainDatabaseAfter) {
      console.log("[e2e] apps/server/data/pawtrip.db 未被修改。");
    } else {
      console.warn(
        "[e2e] 警告: apps/server/data/pawtrip.db 在本次 E2E 期间发生变化；若同时有本地开发服务在写该库，可忽略此警告。",
      );
    }
  }

  if (requestedSignal === "SIGINT") return 130;
  if (requestedSignal === "SIGTERM") return 143;
  return exitCode;
}

process.exitCode = await main();
