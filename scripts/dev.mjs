#!/usr/bin/env node
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = join(repoRoot, "apps", "web");
const viteBin = join(repoRoot, "node_modules", "vite", "bin", "vite.js");

// 企业代理常替换 HTTPS 证书；信任系统证书库后服务端才能连通模型 API。
const nodeOptions = [
  process.env.NODE_OPTIONS,
  ...(process.allowedNodeEnvironmentFlags.has("--use-system-ca")
    ? ["--use-system-ca"]
    : []),
]
  .filter(Boolean)
  .join(" ");

const extraArgs = process.argv.slice(2);
const child = spawn(
  process.execPath,
  [viteBin, "dev", ...(extraArgs.length > 0 ? extraArgs : ["--port", "3000"])],
  {
    cwd: webRoot,
    stdio: "inherit",
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
  },
);

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
