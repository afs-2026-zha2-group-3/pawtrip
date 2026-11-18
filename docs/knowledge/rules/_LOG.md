# Rules change log

| date | id | change | author |
|---|---|---|---|
| 2026-11-13 | pipeline-iac | 新增 process 规则：CI 门禁、CD 边界、制品命名、IaC 与 CI 密钥约定 | Qoder agent |
| 2026-11-13 | pipeline-iac | CI 拆分为 web/server 两个工作流并按路径过滤触发，文档变更不触发 | Qoder agent |
| 2026-11-13 | pipeline-iac | 公共源覆盖改用 NPM_CONFIG_REGISTRY（项目 .npmrc 优先于 npm config set） | Qoder agent |
| 2026-11-14 | pipeline-iac | PR 初次检查与后续 push 分开触发，避免纯文档提交重复运行 CI | Zed agent |
| 2026-11-18 | pipeline-iac | CI 合并为单一 ci.yml：build/frontend/backend/e2e 四个 job，paths-filter 选择执行，build 制品供 e2e 复用 | Qoder agent |
