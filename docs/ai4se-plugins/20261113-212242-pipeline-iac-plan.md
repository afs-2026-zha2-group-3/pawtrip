# Pipeline IaC plan

- root: C:\Users\luoec3\workspace\ita\pawtrip
- scope: ci
- rules_gate: gap-listed
- timestamp: 2026-11-13T21:22:17+0800
- org_template: none

## Probe summary

| item | result |
|---|---|
| `.github/workflows/` | MISSING |
| `.gitlab-ci.yml` | MISSING |
| `terraform/` / `infra/` / `iac/` | MISSING |
| remote origin | `https://github.com/afs-2026-zha2-group-3/pawtrip.git` |
| host | github |

补充事实：

- Monorepo：npm workspaces（`apps/web`，Vite 8 + React 19 + TS）与 Maven（`apps/server`，Spring Boot 4.1.2，Java 21）。
- 验证命令契约：`docs/feedback/verification-commands.md` 约定 `npm run build` 与 `cd apps/server && ./mvnw test`，二者本地已通过。
- `.npmrc` 指向内部 Artifactory（`artifact.oocl.com`），GitHub 托管 runner 不可达；`package-lock.json` 未锁定 registry resolved URL，可在 CI 中安全覆盖为 `https://registry.npmjs.org/`。
- `apps/server/mvnw` 已带可执行位；Maven Wrapper 使用 `repo.maven.apache.org`。

## CREATE

| path | rationale | wrap_from |
|---|---|---|
| `.github/workflows/ci.yml` | GitHub Actions CI：`web` job 执行 `npm ci` + `npm run build`；`server` job 执行 `./mvnw -B test`；对齐验证命令契约，仅 PR/push main 触发，权限只读 | none（按 verification-commands.md 生成） |

### 拟定 workflow 要点（待实现）

- triggers：`pull_request` → `main`，`push` → `main`
- permissions：`contents: read`；concurrency 按 ref 取消进行中运行
- `web`：`actions/setup-node@v4`（Node 24，`cache: npm`，`cache-dependency-path: package-lock.json`）；先 `npm config set registry https://registry.npmjs.org/` 覆盖内部源，再 `npm ci`、`npm run build`
- `server`：`actions/setup-java@v4`（Temurin 21，`cache: maven`）；`cd apps/server && ./mvnw -B test`
- 不上传发布制品、不触发部署、不写入任何密钥（secrets 一律走仓库 Secret 约定，本次不需要）

## SKIP

| path | rationale |
|---|---|
| `.gitlab-ci.yml` | host=github，非 GitLab |
| `terraform/`、`infra/`、`iac/` | scope=ci，本次不生成 IaC |
| 部署 workflow | 部署触发属 `/sdd:deploy-artifacts` 范围 |

## CONFLICT

| path | rationale | action |
|---|---|---|
| — | 无既有 workflow 文件 | — |

## Rules gaps

| block | note | next |
|---|---|---|
| CI stages and gates | 无显式规则文件；以 `docs/feedback/verification-commands.md` 为事实来源 | /sdd:rules-govern |
| CD trigger boundaries | 缺失；本次 scope=ci，不涉及 | /sdd:rules-govern |
| Artifact naming | 缺失；CI 仅做构建/测试校验，不产出发布制品 | /sdd:rules-govern |
| IaC tool + directory conventions | 缺失；本次不生成 IaC | /sdd:rules-govern |
| Secret handling | 已覆盖：`@rule:no-hardcoded-secrets`、`@rule:security-baseline` | — |

## Disclaimer

Dry-run until the user explicitly confirms materialize. Secrets must not be
committed. This plan does not trigger deploys or replace enterprise CD.
