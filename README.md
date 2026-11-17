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

配置高德 POI 搜索 Key：复制仓库根目录 `.env.example` 为 `.env`，再填写真实的 `AMAP_API_KEY`。`.env` 已被 Git 忽略，不要提交真实密钥。后端启动时会根据应用产物位置自动查找仓库根目录的 `.env`，不受启动时当前目录影响；进程环境变量 `AMAP_API_KEY` 优先于文件值。没有 `.env` 时后端仍可启动，但实际调用高德 POI 搜索需要配置 Key。

前端地图使用高德 JS API 2.0，需要单独的 Web端 JS API Key 和安全密钥：在根目录 `.env` 填写 `VITE_AMAP_JS_KEY` 与 `VITE_AMAP_SECURITY_CODE`（Vite 通过 `envDir` 读取根目录 `.env`，只暴露 `VITE_` 前缀）。未配置时地点页地图显示占位，列表功能不受影响；生产环境建议通过代理 `serviceHost` 使用安全密钥，不要把安全密钥直接打进前端 bundle。

图片下载仅允许 HTTPS 且默认精确匹配 `store.is.autonavi.com`，同时限制重定向次数、连接/读取超时及单张大小（默认 5 MiB）。若高德返回的照片使用其他已确认的官方图片 host，可通过 `location.images.allowed-hosts` 配置精确 host 列表；不要配置通配符或未验证的域名。

如果部署 JAR 位于仓库之外，请在启动进程的环境中设置 `PAWTRIP_ENV_FILE` 为 `.env` 的绝对路径；该变量不能只写在待加载的 `.env` 文件中。

按顺序在两个终端启动后端与前端:

```bash
cd apps/server
./mvnw spring-boot:run
```

```bash
npm run dev
```

- 重置数据库:停止后端,删除 `apps/server/data/pawtrip.db`,重新启动。Flyway 会依次执行所有版本化迁移,创建/更新 schema 并导入固定行政区数据、珠海地点种子数据(V19)和珠海测试酒店/餐厅(V23/V24/V25,含宠物政策、5km 内外样本、真实 POI 坐标与照片/评分 JSON),不会创建账号。已有同 `poi_id` 的地点保留后台编辑结果;需要重新生成 V19 时,运行 `node scripts/generate-location-seed-migration.mjs`;已应用过旧版 V19 的本地库会因校验和不一致启动失败,重置数据库即可。已有 V2 数据升级时,V3 为 `app_user.role` 设置默认 `USER`,保留原账号;若确实遇到旧版 V2 校验失败,先备份后再按需重置数据库。
- 注入本地/测试账号:后端首次启动、Flyway 完成迁移后,在根目录运行 `npm run seed:users`。脚本通过 bcrypt 哈希并按用户名幂等 upsert 账号和角色。默认普通账号为 `demo` / `123456`,管理员账号为 `admin` / `123456`。这些凭据仅供本地开发与测试,不得用于其他环境。
- 指定其他数据库:`npm run seed:users -- <db-path>` 或设置 `SEED_DB` 环境变量。
- 登录:打开 `http://localhost:3000/` 会跳转到 `/login`;使用种子脚本中的普通或管理员账号登录后进入首页。
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

测试默认按文件并行（本地 4 个 worker，CI 2 个）。每个 worker 使用独立的 `petowner-wN` 账号及宠物档案，避免行程、宠物等用户级数据互相覆盖；可用 `PAWTRIP_E2E_WORKERS=8 npm run test:e2e` 调整并发的 worker 数（上限 8）。E2E 种子脚本会拒绝把 worker 账号或测试景点写入开发库。
