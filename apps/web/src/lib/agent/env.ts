import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface LoadAgentEnvOptions {
  cwd?: string;
  moduleDir?: string;
  load?: (path: string) => void;
}

const workspaceEnv = (root: string) => [
  resolve(root, ".env.local"),
  resolve(root, ".env"),
];

/**
 * 前端开发服务器（vite dev）会从工作区目录和仓库根目录加载 `.env`。
 * 已存在的 shell 环境变量优先，`process.loadEnvFile` 不会覆盖它们。
 */
export function agentEnvFileCandidates(
  cwd = process.cwd(),
  moduleDir = dirname(fileURLToPath(import.meta.url)),
): string[] {
  const candidates = [...workspaceEnv(cwd)];
  if (/[\\/]apps[\\/]web$/.test(cwd)) {
    candidates.push(...workspaceEnv(resolve(cwd, "../..")));
  }
  // 源码中该文件位于 apps/web/src/lib/agent，向上一级分别是 apps/web 与仓库根目录。
  candidates.push(...workspaceEnv(resolve(moduleDir, "../../..")));
  candidates.push(...workspaceEnv(resolve(moduleDir, "../../../../..")));
  return [...new Set(candidates)];
}

export function loadAgentEnv(options: LoadAgentEnvOptions = {}): string[] {
  const load = options.load ?? ((path: string) => process.loadEnvFile(path));
  const loaded: string[] = [];
  for (const file of agentEnvFileCandidates(options.cwd, options.moduleDir)) {
    if (!existsSync(file)) continue;
    try {
      load(file);
      loaded.push(file);
    } catch {
      // 忽略不存在或格式异常的 env 文件，保留 shell 环境变量。
    }
  }
  return loaded;
}
