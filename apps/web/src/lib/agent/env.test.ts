import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { agentEnvFileCandidates, loadAgentEnv } from "./env";

let tempRoot: string | null = null;

function workspace() {
  tempRoot = mkdtempSync(join(tmpdir(), "pawtrip-env-"));
  const web = join(tempRoot, "apps", "web");
  mkdirSync(web, { recursive: true });
  return { root: tempRoot, web };
}

afterEach(() => {
  if (tempRoot) {
    rmSync(tempRoot, { recursive: true, force: true });
    tempRoot = null;
  }
});

describe("agent env loading", () => {
  it("loads apps/web/.env followed by the repo root .env", () => {
    const { root, web } = workspace();
    writeFileSync(join(web, ".env"), "BIGMODEL_API_KEY=from-web\n");
    writeFileSync(join(root, ".env"), "BIGMODEL_API_KEY=from-root\n");
    const seen: string[] = [];

    const loaded = loadAgentEnv({
      cwd: web,
      moduleDir: join(web, "src", "lib", "agent"),
      load: (path) => seen.push(path),
    });

    expect(loaded).toEqual([join(web, ".env"), join(root, ".env")]);
    expect(seen).toEqual(loaded);
  });

  it("prefers .env.local and skips missing files", () => {
    const { web } = workspace();
    writeFileSync(join(web, ".env.local"), "PAWTRIP_AGENT_PROVIDER=fake\n");
    writeFileSync(join(web, ".env"), "PAWTRIP_AGENT_PROVIDER=bigmodel\n");
    const seen: string[] = [];

    loadAgentEnv({
      cwd: web,
      moduleDir: join(web, "src", "lib", "agent"),
      load: (path) => seen.push(path),
    });

    expect(seen[0]).toBe(join(web, ".env.local"));
    expect(seen[1]).toBe(join(web, ".env"));
  });

  it("returns deterministic deduplicated candidates", () => {
    const { root, web } = workspace();
    const candidates = agentEnvFileCandidates(web, join(web, "src", "lib", "agent"));

    expect(new Set(candidates).size).toBe(candidates.length);
    expect(candidates).toContain(join(web, ".env"));
    expect(candidates).toContain(join(root, ".env"));
  });

  it("ignores unreadable env files and keeps loading the rest", () => {
    const { root, web } = workspace();
    writeFileSync(join(web, ".env"), "A=1\n");
    writeFileSync(join(root, ".env"), "B=2\n");

    const loaded = loadAgentEnv({
      cwd: web,
      moduleDir: join(web, "src", "lib", "agent"),
      load: (path) => {
        if (path === join(web, ".env")) throw new Error("invalid env");
      },
    });

    expect(loaded).toEqual([join(root, ".env")]);
  });
});
