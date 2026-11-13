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

1. CI 平台为 GitHub Actions，唯一工作流为 `.github/workflows/ci.yml`；触发条件为发往 `main` 的 pull request 与 `main` 分支的 push。不新增第二套 CI 产品（Jenkins、GitLab CI 等），确需引入时必须先在同一变更中修改本规则。
2. CI 阶段与门禁以 `docs/feedback/verification-commands.md` 的命令契约为准：`web` job 执行 `npm ci` 与 `npm run build`；`server` job 在 `apps/server` 执行 `./mvnw -B test`。增删门禁必须同时更新该契约与工作流。
3. runner 使用 GitHub 托管 `ubuntu-latest`，Node 24、Temurin JDK 21，并启用 npm 与 Maven 依赖缓存。`.npmrc` 指向组织内部 Artifactory，托管 runner 不可达，因此公共源覆盖只允许写在 CI 步骤中（`npm config set registry https://registry.npmjs.org/`），不得改写仓库 `.npmrc`。
4. CD 边界：本仓库当前没有部署流水线。发布与部署不属于 CI 范围，须通过 `/sdd:deploy-artifacts` 并取得人工批准；CI 工作流不得持有部署凭据或触发部署。引入部署自动化必须先更新本规则。
5. 制品命名：后端构建产物为 Maven 默认命名 `apps/server/target/pawtrip-server-<version>.jar`，前端构建产物输出到 `apps/web/dist/`。CI 仅校验构建与测试，不上传或发布发布制品；任何对外发布的制品命名须先在本规则登记。
6. IaC：当前未配置 IaC 工具或基础设施目录。引入 IaC 必须由变更规格记录工具、目录约定、状态后端与密钥注入方式；在此之前不得临时添加 `terraform/`、`infra/` 或 `iac/` 骨架。
7. 密钥：工作流不得包含明文密钥（见 `@rule:no-hardcoded-secrets`）；凭据只能来自仓库或环境 Secret，`permissions` 默认保持只读。

## Rationale

让 CI 门禁与已验证命令契约保持单一事实来源，固定 CD 与 IaC 的引入边界，避免 agent 或临时改动另起流水线、泄露密钥或在无 IaC 约定的情况下生成基础设施骨架。

## Verification

| Check | Blocks |
|---|---|
| CI 各 job 与 `docs/feedback/verification-commands.md` 一致，且全部通过 | pr-merge |
| 工作流保持 `permissions: contents: read`、无明文密钥、不包含部署触发 | pr-merge |
| 新增 CI/CD/IaC 能力已登记在本规则 | pr-merge |

## Examples

### Good

- 新增前端 lint 门禁：同一次变更中更新 `verification-commands.md`、`ci.yml` 与本规则第 2 条。
- 依赖安装沿用工作流内的公共源覆盖，仓库 `.npmrc` 保持内部 Artifactory 不变。

### Bad

- 新增 `Jenkinsfile` 或部署 job，并在工作流中写入云厂商密钥。
- 在没有变更规格与 IaC 约定的情况下提交 `terraform/` 骨架。

## Exceptions

- 无。例外必须通过同一 PR 更新本规则。
