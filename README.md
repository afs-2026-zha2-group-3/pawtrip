# AI4SE Baseline

A starting repository for AI-assisted, specification-driven development with
Qoder or GitHub Copilot. It includes the project skeleton, OpenSpec prompts,
AI4SE skills and agents, and Superpowers skills as ordinary repository files.
Cloning does not require access to the author's machine or another private repository.

## Start

1. Clone your class's `ai4se-baseline` repository and open its root in Qoder or
   GitHub Copilot.
2. Install Node.js 24 or later and Git. For OpenSpec commands, install the
   matching CLI: `npm install -g @fission-ai/openspec@1.16.1`.
3. Run `node --test scripts/portability.test.mjs` to check the bundled files.
   Run `openspec --version` to check the separately installed CLI.
4. Read [AGENTS.md](AGENTS.md) and the
   [SDD command catalog](vendor/ai4se-plugins/commands/catalog.md).
   Qoder exposes the `sdd-*` skills; in an existing session use `/skills reload`
   and `/agents reload`. Copilot's skills and custom agents are under `.github/`.

The bundled skills are already available after cloning. Do not run the original
plugin installer merely to use this baseline. Shell-based skill helpers require
Bash (for example Git Bash on Windows); their use depends on the selected skill.

## Project content

- [Knowledge base](docs/knowledge/_INDEX.md)
- [Requirement workspace](requirement-workspace/README.md)
- [OpenSpec workspace](openspec/README.md)
- [Harness scripts](scripts/README.md)
- [Bundled dependency versions and licenses](vendor/README.md)

This baseline has no application implementation or CI/CD pipeline. The four
original harness scripts are intentional placeholders and exit with a message
until the project supplies an implementation.

## Create your own skill

Ask your agent: "Use skills-creator to turn my test-result reporting workflow
into a reusable skill." The [skills-creator](skills/skills-creator/SKILL.md)
helps define the trigger, inputs, output, instructions, and a practical trial.
It is included in both Qoder and GitHub Copilot.

Author project skills in `skills/<name>/SKILL.md`, then run:

```sh
node scripts/refresh-agent-assets.mjs
node --test scripts/portability.test.mjs
```

The refresh copies project skills into both hosts and keeps their resource links
portable. Commit the source and generated copies together when ready. It preserves
host-only custom skills with different names.

## Maintain the bundled assets

The AI4SE runtime sources and shared resources are under `vendor/ai4se-plugins/`.
Superpowers sources are under `vendor/superpowers/`. After updating these sources,
run `node scripts/refresh-agent-assets.mjs`, then the portability tests above.
The refresh reuses the AI4SE pack's copy projection and produces relative resource
links for both hosts. Commit the bundled sources and their host projections together.

### 开发

首次启动前安装依赖:

```bash
npm install
```

配置高德 POI 搜索 Key：在仓库根目录创建 `.env` 并设置 `AMAP_API_KEY`，或直接设置进程环境变量。`.env` 已被 Git 忽略，不要提交真实密钥。后端启动时会根据应用产物位置自动查找仓库根目录的 `.env`，不受启动时当前目录影响；进程环境变量 `AMAP_API_KEY` 优先于文件值。没有 `.env` 时后端仍可启动，但实际调用高德 POI 搜索需要配置 Key。

如果部署 JAR 位于仓库之外，请在启动进程的环境中设置 `PAWTRIP_ENV_FILE` 为 `.env` 的绝对路径；该变量不能只写在待加载的 `.env` 文件中。

按顺序在两个终端启动后端与前端:

```bash
cd apps/server
./mvnw spring-boot:run
```

```bash
npm run dev
```

- 重置数据库:停止后端,删除 `apps/server/data/pawtrip.db`,重新启动。Flyway 会依次执行 `V1`(问候语)与 `V2`(用户表);迁移不注入任何账号。若本地已有旧版 `V2` 记录并出现 Flyway 校验失败,同样按此方式重置。
- 注入本地/测试账号:后端首次启动、`app_user` 表创建后,在根目录运行 `npm run seed:users`。账号与密码集中定义在 `scripts/seed-users.mjs`,可自行增删;脚本以 bcrypt 哈希幂等写入,重复运行不会产生重复账号。
- 指定其他数据库:`npm run seed:users -- <db-path>` 或设置 `SEED_DB` 环境变量。
- 登录:打开 `http://localhost:3000/` 会跳转到 `/login`;使用种子脚本中的账号登录后进入首页。
- 登出:顶部导航栏“退出登录”;登出后受保护页面会再次跳转 `/login`。
- 认证使用服务端会话 cookie(`JSESSIONID`),不使用 JWT,也不在浏览器存储中保存认证令牌。

### E2E 测试

E2E 测试需要 Node.js 24+、Java 21+。Node.js 24 是因为账号种子脚本使用内置的 `node:sqlite`。

安装项目 npm 依赖：

```bash
npm install
```

`npm install` 只安装 Playwright 测试包，不会下载浏览器。本地有头测试使用机器上已安装的 Google Chrome，不需要安装 Playwright 管理的浏览器。本地有头运行（会打开 Chrome 窗口）：

```bash
npm run test:e2e:headed
```

无头运行（与 CI 相同的测试模式）：

```bash
npm run test:e2e
```

本地若要运行无头测试，需另行安装 Playwright Chromium：

```bash
npx playwright install chromium
```

CI 会自动安装 Chromium 及所需系统依赖。

这两个命令都会自动启动后端和前端、运行测试并清理子进程。每次运行在系统临时目录创建全新的 SQLite 数据库，先执行 Flyway 迁移，再将测试账号写入该库；不会读取、清理或修改 `apps/server/data/pawtrip.db`。测试服务使用独立的 `18080`（后端）和 `3100`（前端）端口；若端口已被占用，命令会失败而不会复用已有服务。Playwright 报告保存在 `playwright-report/`，失败诊断保存在 `test-results/`。
