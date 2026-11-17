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

1. CI 平台为 GitHub Actions，按应用拆分 web、server 工作流，并为跨端浏览器验证单独维护 `.github/workflows/e2e.yml`。不新增第二套 CI 产品（Jenkins、GitLab CI 等），确需引入时必须先在同一变更中修改本规则。
2. 触发边界：所有工作流均响应发往 `main` 的 pull request（`opened`、`synchronize`、`reopened`）与发往 `main` 的 push；均用 `paths` 限定对应代码、依赖或工作流自身变更。功能分支不监听 push，避免同仓分支在 push 与 PR 事件下对同一套 CI 重复执行；PR 的后续提交由 `synchronize` 触发。web 监听 `apps/web/**`、根 `package.json`、`package-lock.json`、`.npmrc` 与 `.github/workflows/web.yml`；server 监听 `apps/server/**` 与 `.github/workflows/server.yml`；e2e 监听 `apps/web/**`、`apps/server/**`、`e2e/**`、`scripts/run-e2e.mjs`、`scripts/seed-users.mjs`、`scripts/seed-e2e-attractions.mjs`、根依赖与 Playwright 配置、`.npmrc` 及自身工作流。纯文档变更不触发 CI。
3. CI 阶段与门禁以 `docs/feedback/verification-commands.md` 的命令契约为准：web 工作流执行 `npm ci` 与 `npm run build`；server 工作流在 `apps/server` 执行 `./mvnw -B test`；e2e 工作流执行 `npm ci`、`npx playwright install --with-deps chromium` 与 `CI=true npm run test:e2e`，并上传 Playwright 报告及诊断。增删门禁必须同时更新该契约与对应工作流。
4. runner 使用 GitHub 托管 `ubuntu-latest`，Node 24、Temurin JDK 21，并启用 npm 与 Maven 依赖缓存。`.npmrc` 指向组织内部 Artifactory，托管 runner 不可达，因此公共源覆盖只允许通过 CI 环境变量 `NPM_CONFIG_REGISTRY=https://registry.npmjs.org/`（或 npm 命令参数）设置；`npm config set` 写入用户级配置、优先级低于项目 `.npmrc`，不得用于覆盖，也不得改写仓库 `.npmrc`。
5. CD 边界：本仓库当前没有部署流水线。发布与部署不属于 CI 范围，须通过 `/sdd:deploy-artifacts` 并取得人工批准；CI 工作流不得持有部署凭据或触发部署。引入部署自动化必须先更新本规则。
6. 制品命名：后端构建产物为 Maven 默认命名 `apps/server/target/pawtrip-server-<version>.jar`，前端构建产物输出到 `apps/web/dist/`。CI 仅校验构建与测试，不上传或发布发布制品；任何对外发布的制品命名须先在本规则登记。
7. IaC：当前未配置 IaC 工具或基础设施目录。引入 IaC 必须由变更规格记录工具、目录约定、状态后端与密钥注入方式；在此之前不得临时添加 `terraform/`、`infra/` 或 `iac/` 骨架。
8. 密钥：工作流不得包含明文密钥（见 `@rule:no-hardcoded-secrets`）；凭据只能来自仓库或环境 Secret，`permissions` 默认保持只读。

## Rationale

让 CI 门禁与已验证命令契约保持单一事实来源，固定 CD 与 IaC 的引入边界，避免 agent 或临时改动另起流水线、泄露密钥或在无 IaC 约定的情况下生成基础设施骨架；同时避免同一提交在功能分支 push 与 PR 事件下重复占用 runner。

## Verification

| Check | Blocks |
|---|---|
| 三个工作流保持 web/server/e2e 按应用隔离；PR（`opened`/`synchronize`/`reopened`）与 `main` push 各触发一次，功能分支不再同时响应 push 与 PR；纯文档变更不触发 CI | pr-merge |
| CI 各工作流与 `docs/feedback/verification-commands.md` 一致，且全部通过 | pr-merge |
| 工作流保持 `permissions: contents: read`、无明文密钥、不包含部署触发 | pr-merge |
| 新增 CI/CD/IaC 能力已登记在本规则 | pr-merge |

## Examples

### Good

- 新增前端 lint 门禁：同一次变更中更新 `verification-commands.md`、`web.yml` 与本规则第 3 条。
- 依赖安装沿用工作流内的 `NPM_CONFIG_REGISTRY` 公共源覆盖，仓库 `.npmrc` 保持内部 Artifactory 不变。

### Bad

- 新增 `Jenkinsfile` 或部署 job，并在工作流中写入云厂商密钥。
- 在没有变更规格与 IaC 约定的情况下提交 `terraform/` 骨架。

## Exceptions

- 无。例外必须通过同一 PR 更新本规则。
