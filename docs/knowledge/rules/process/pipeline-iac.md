# pipeline-iac — CI 门禁、CD 边界、制品与 IaC 约定

## Metadata

| Field | Value |
|---|---|
| **ID** | pipeline-iac |
| **Category** | process |
| **Priority** | High |
| **Activation** | always |
| **Applies To** | all |
| **Stack** | — |

## Rule

1. CI 平台为 GitHub Actions，统一维护单一 `.github/workflows/ci.yml`，内含 `build`、`frontend`、`backend`、`e2e` 四个 job，以及负责变更检测的 `changes` job。不新增第二套 CI 产品（Jenkins、GitLab CI 等），确需引入时必须先在同一变更中修改本规则。
2. 触发边界：工作流响应发往 `main` 的 pull request（`opened`、`synchronize`、`reopened`）与发往 `main` 的 push。功能分支不监听 push，避免同仓分支在 push 与 PR 事件下对同一套 CI 重复执行；PR 的后续提交由 `synchronize` 触发。工作流不使用顶层 `paths`，由 `changes` job 中的 `dorny/paths-filter` 按变更文件选择要执行的 job：web 匹配 `apps/web/**`、根 `package.json`、`package-lock.json`、`.npmrc` 与 `.github/workflows/ci.yml`；server 匹配 `apps/server/**` 与自身工作流；e2e 匹配 `apps/web/**`、`apps/server/**`、`e2e/**`、`scripts/run-e2e.mjs`、`scripts/seed-users.mjs`、`scripts/seed-e2e-attractions.mjs`、根依赖与 Playwright 配置、`.npmrc` 及自身工作流。纯文档变更只运行 `changes` job，不执行业务门禁。
3. CI 阶段与门禁以 `docs/feedback/verification-commands.md` 的命令契约为准：`build` job 执行 `npm ci`、`npm run build` 与 `apps/server` 下的 `./mvnw -B -DskipTests package`，并上传 `web-dist`、`server-jar` 运行内制品；`frontend` job 执行 `npm ci` 与 `npm run test -w apps/web`；`backend` job 在 `apps/server` 执行 `./mvnw -B test`；`e2e` job 在 `build`、`frontend`、`backend` 均未失败时执行 `npm ci`、`npx playwright install --with-deps chromium` 与 `CI=true npm run test:e2e`，server 变更时复用 `server-jar` 制品，并上传 Playwright 报告及诊断。增删门禁必须同时更新该契约与对应工作流。
4. runner 使用 GitHub 托管 `ubuntu-latest`，Node 24、Temurin JDK 21，并启用 npm 与 Maven 依赖缓存。`.npmrc` 指向组织内部 Artifactory，托管 runner 不可达，因此公共源覆盖只允许通过 CI 环境变量 `NPM_CONFIG_REGISTRY=https://registry.npmjs.org/`（或 npm 命令参数）设置；`npm config set` 写入用户级配置、优先级低于项目 `.npmrc`，不得用于覆盖，也不得改写仓库 `.npmrc`。
5. CD 边界：本仓库当前没有部署流水线。发布与部署不属于 CI 范围，须通过 `/sdd:deploy-artifacts` 并取得人工批准；CI 工作流不得持有部署凭据或触发部署。引入部署自动化必须先更新本规则。
6. 制品命名：后端构建产物为 Maven 默认命名 `apps/server/target/pawtrip-server-<version>.jar`，前端构建产物输出到 `apps/web/dist/`。`build` job 将 `web-dist`（`apps/web/dist/`）与 `server-jar`（上列 jar）作为运行内 artifact 上传，供 e2e 复用与诊断；CI 不对外发布或部署制品，任何对外发布的制品命名须先在本规则登记。
7. IaC：当前未配置 IaC 工具或基础设施目录。引入 IaC 必须由变更规格记录工具、目录约定、状态后端与密钥注入方式；在此之前不得临时添加 `terraform/`、`infra/` 或 `iac/` 骨架。
8. 密钥：工作流不得包含明文密钥（见 `@rule:no-hardcoded-secrets`）；凭据只能来自仓库或环境 Secret，`permissions` 仅保留只读的 `contents: read` 与 `pull-requests: read`（后者供 paths-filter 读取 PR 变更文件）。

## Rationale

让四个 job 在同一个工作流 run 内可见并按变更范围选择性执行，保持按应用隔离与已验证命令契约的单一事实来源；固定 CD 与 IaC 的引入边界，避免 agent 或临时改动另起流水线、泄露密钥或在无 IaC 约定的情况下生成基础设施骨架；同时避免同一提交在功能分支 push 与 PR 事件下重复占用 runner。

## Verification

| Check | Blocks |
|---|---|
| 单一 `ci.yml` 保持 `build`/`frontend`/`backend`/`e2e` 四个 job，由 paths-filter 按变更选择性执行；PR（`opened`/`synchronize`/`reopened`）与 `main` push 各触发一次；纯文档变更不执行业务门禁 | pr-merge |
| CI 各 job 与 `docs/feedback/verification-commands.md` 一致，且全部通过 | pr-merge |
| 工作流保持只读 `permissions`（`contents: read`、`pull-requests: read`）、无明文密钥、不包含部署触发 | pr-merge |
| 新增 CI/CD/IaC 能力已登记在本规则 | pr-merge |

## Examples

### Good

- 新增前端 lint 门禁：同一次变更中更新 `verification-commands.md`、`.github/workflows/ci.yml` 与本规则第 3 条。
- 依赖安装沿用工作流内的 `NPM_CONFIG_REGISTRY` 公共源覆盖，仓库 `.npmrc` 保持内部 Artifactory 不变。

### Bad

- 新增 `Jenkinsfile` 或部署 job，并在工作流中写入云厂商密钥。
- 在没有变更规格与 IaC 约定的情况下提交 `terraform/` 骨架。

## Exceptions

- 无。例外必须通过同一 PR 更新本规则。
